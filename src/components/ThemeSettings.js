"use client";
import {useId} from 'react';
import {useTheme} from '../app/lib/ThemeProvider';
export default function ThemeSettings() {
  const {preference, resolvedTheme, chooseTheme, canSave} = useTheme();
  const name = useId();
  return <section className="appearance-settings" aria-labelledby={name+'-heading'}>
    <h2 id={name+'-heading'}>Appearance</h2>
    <p>Choose how AfriPlate looks on this browser.</p>
    <fieldset><legend className="theme-sr-only">Colour theme</legend><div className="theme-options">
      {[['light','Light'],['dark','Dark'],['system','System']].map(([value,label]) => <label key={value} className={'theme-option'+(preference===value?' selected':'')}>
        <input type="radio" name={name} value={value} checked={preference===value} onChange={() => chooseTheme(value)}/>
        <ThemeIcon theme={value}/><span>{label}</span>
      </label>)}
    </div></fieldset>
    <p className="theme-feedback" role="status">{!canSave ? 'Applied for this visit. Browser storage is unavailable, so this choice cannot be saved.' : preference==='system' ? 'Follows your device setting. Currently using '+resolvedTheme+' mode.' : 'Your '+preference+' theme is saved for this browser.'}</p>
  </section>;
}
function ThemeIcon({theme}) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {theme==='light'?<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>:theme==='dark'?<path d="M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z"/>:<><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></>}
  </svg>;
}
