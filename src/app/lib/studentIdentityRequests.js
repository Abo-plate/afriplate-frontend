import axios from 'axios';
import {API_BASE} from './endpoints';
// Dedicated transport: an upload error must stay visible beside its retained draft.
// Authentication is still enforced by the same server-side protect middleware.
const transport=axios.create({baseURL:API_BASE,timeout:15000});
const headers=()=>{
 const token=typeof window!=='undefined'?localStorage.getItem('token'):null;
 if(!token)throw Object.assign(new Error('Sign in again before submitting your ID.'),{status:401});
 return {Authorization:'Bearer '+token};
};
export const readStudentIdentity=async(clientId,signal,expectedUserId)=>{
 const {data}=await transport.get('/auth/student-id',{headers:headers(),params:{expected_user_id:String(expectedUserId),...(clientId?{client_id:clientId}:{})},signal});
 if(!Number.isSafeInteger(data?.account_id))throw Object.assign(new Error('Status response incomplete'),{code:'STUDENT_ID_RESPONSE_INVALID'});
 if(data.account_id!==expectedUserId)throw Object.assign(new Error('Account response changed'),{status:401,code:'STUDENT_ID_ACCOUNT_CHANGED'});
 if(!data||!Object.prototype.hasOwnProperty.call(data,'submission')||(data.submission!==null&&(!data.submission?.id||!data.submission?.status)))throw Object.assign(new Error('Status response incomplete'),{code:'STUDENT_ID_RESPONSE_INVALID'});
 return data;
};
export const uploadStudentIdentity=async(attempt,signal,onUploadProgress)=>{
 const body=new FormData();for(const field of ['university_id','university','matric_number'])body.append(field,attempt.details[field]||'');
 body.append('expected_user_id',String(attempt.userId));body.append('client_id',attempt.id);body.append('student_id',attempt.file);
 const {data}=await transport.post('/auth/student-id',body,{headers:{...headers(),'Content-Type':undefined},timeout:90000,signal,onUploadProgress});
 if(!Number.isSafeInteger(data?.account_id))throw Object.assign(new Error('Upload response incomplete'),{code:'STUDENT_ID_RESPONSE_INVALID'});
 if(data.account_id!==attempt.userId)throw Object.assign(new Error('Account response changed'),{status:401,code:'STUDENT_ID_ACCOUNT_CHANGED'});
 if(!data||!/^[1-9]\d*$/.test(String(data.submission_id||''))||!['pending','approved','replacement_requested'].includes(data.student_id_status))throw Object.assign(new Error('Upload response incomplete'),{code:'STUDENT_ID_RESPONSE_INVALID'});
 return data;
};
export const identityErrorStatus=error=>error?.response?.status||error?.status||0;
export const uncertainIdentityUpload=error=>!identityErrorStatus(error)||identityErrorStatus(error)>=500||identityErrorStatus(error)===408;
export const identityErrorMessage=error=>{
 const status=identityErrorStatus(error),code=error?.response?.data?.code||error?.code;
 if(code==='STUDENT_ID_ACCOUNT_CHANGED')return 'Your account changed. Sign in again before submitting.';
 if(status===401)return 'Your session expired. Sign in again, then retry.';
 if(status===403)return 'Your account cannot submit an ID. Contact support.';
 if(status===413||code==='STUDENT_ID_PHOTO_TOO_LARGE')return 'Choose a photo of 5 MB or smaller.';
 if(code==='STUDENT_ID_PHOTO_INVALID')return 'This photo could not be read. Choose another JPG or PNG.';
 if(code==='STUDENT_ID_PHOTO_REQUIRED')return 'Choose a JPG or PNG student ID photo.';
 if(code==='STUDENT_ID_REPLACEMENT_UNCHANGED')return 'Update your details or choose a replacement photo.';
 if(code==='STUDENT_ID_MULTIPART_INVALID')return 'Choose one JPG or PNG photo and retry.';
 if(code==='STUDENT_ID_RESPONSE_INVALID')return 'The server response was incomplete. Check saved status.';
 if(code==='SECURE_BROWSER_REQUIRED')return 'Open AfriPlate in an updated browser using HTTPS.';
 if(status===429)return 'Too many upload attempts. Wait before trying again.';
 if(status===409)return 'These student details need an account review. Contact support.';
 if(code==='STUDENT_ID_DETAILS_INVALID'){const message=error?.response?.data?.message||'';if(message.includes('matric'))return 'Enter a valid matric number exactly as issued.';if(message.includes('university'))return 'Choose your university or enter its full name.';}
 if(status===400)return 'Check your university, matric number and photo.';
 if(status>=500)return 'ID uploads are unavailable. Check saved status before retrying.';
 return 'Connection interrupted. Check saved status before retrying.';
};
