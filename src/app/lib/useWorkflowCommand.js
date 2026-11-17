"use client";
import {useRef,useState} from 'react';
import api from './api';
export function useWorkflowCommand(){
 const keys=useRef(new Map()),locked=useRef(false);const [busy,setBusy]=useState(false);
 const command=async(path,payload={})=>{
  if(locked.current)throw Error('Please wait for the current action to finish.');locked.current=true;setBusy(true);
  const signature=path+JSON.stringify(payload);if(!keys.current.has(signature))keys.current.set(signature,crypto.randomUUID());
  try{const result=await api.post(path,{...payload,client_id:keys.current.get(signature)});keys.current.delete(signature);return result.data;}
  finally{locked.current=false;setBusy(false);}
 };
 return {command,busy};
}
