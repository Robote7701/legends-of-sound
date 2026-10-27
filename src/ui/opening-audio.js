// Short original synthesized cues; no recordings or external audio assets.
export function openingAudio() {
  let context, enabled=false;
  const nodes=new Set();
  function stop(){for(const node of nodes){try{node.stop();}catch{}}nodes.clear();}
  function toggle(){enabled=!enabled;if(!enabled)stop();else{try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(Audio){context ||= new Audio();context.resume().catch(()=>{});}}catch{}}return enabled;}
  function play(kind='common') {
    if(!enabled)return;
    try {
      const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
      context ||= new Audio();context.resume().catch(()=>{});
      const tones=kind==='legendary'?[261.63,329.63,392,523.25]:kind==='epic'?[293.66,369.99,440]:kind==='rare'?[329.63,440]:kind==='tear'?[110,165]:[392];
      tones.forEach((frequency,i)=>{const osc=context.createOscillator(),gain=context.createGain(),at=context.currentTime+i*.075;osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.045,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+.42);osc.connect(gain);gain.connect(context.destination);nodes.add(osc);osc.onended=()=>{nodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+.45);});
    } catch { /* Audio unavailable: opening remains fully usable. */ }
  }
  return {toggle,play,close(){stop();context?.close().catch(()=>{});}};
}
