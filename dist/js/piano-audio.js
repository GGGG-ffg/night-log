/* Small additive piano-like synthesizer. No downloaded samples or autoplay. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Night.pianoAudio=api;})(typeof window==='object'?window:globalThis,()=>{
  function create(Context,onError=()=>{}){
    let context,master,disposed=false,volume=.38;const voices=new Map();
    function finish(voice){for(const node of voice.nodes||[]){try{node.disconnect();}catch{}}}
    async function start(midi,frequency){
      if(disposed||voices.has(midi))return false;const voice={nodes:[],oscillators:[]};voices.set(midi,voice);
      try{
        if(!context){context=new Context();master=context.createGain();master.gain.value=volume*.24;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=18;limiter.ratio.value=12;limiter.attack.value=.003;limiter.release.value=.15;master.connect(limiter).connect(context.destination);}
        if(context.state==='suspended')await context.resume();
        if(disposed||voices.get(midi)!==voice)return false;
        if(context.state!=='running')throw Error('Audio unavailable');
        const t=context.currentTime,gain=context.createGain();gain.connect(master);voice.gain=gain;voice.nodes.push(gain);
        gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.72,t+.008);gain.gain.exponentialRampToValueAtTime(.2,t+.28);gain.gain.exponentialRampToValueAtTime(.015,t+3.8);
        [1,.3,.12,.045].forEach((amount,i)=>{const osc=context.createOscillator(),partial=context.createGain();osc.type='sine';osc.frequency.value=frequency*(i+1);partial.gain.value=amount;osc.connect(partial).connect(gain);voice.nodes.push(osc,partial);voice.oscillators.push(osc);osc.start(t);});
        return true;
      }catch{if(voices.get(midi)===voice)voices.delete(midi);finish(voice);if(!disposed)onError();return false;}
    }
    function stop(midi){const v=voices.get(midi);if(!v)return;voices.delete(midi);if(!v.gain)return;const t=context.currentTime,param=v.gain.gain;if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(t);else{const value=param.value;param.cancelScheduledValues(t);param.setValueAtTime(Math.max(.0001,value),t);}param.setTargetAtTime(.0001,t,.055);v.oscillators[0].onended=()=>finish(v);for(const osc of v.oscillators)osc.stop(t+.25);}
    return{start,stop,setVolume(value){volume=Math.max(0,Math.min(1,value));if(master)master.gain.setTargetAtTime(volume*.24,context.currentTime,.015);},silence(){for(const midi of [...voices.keys()])stop(midi);},dispose(){disposed=true;for(const v of voices.values())finish(v);voices.clear();if(context){const old=context;context=null;old.close().catch(()=>{});}},get count(){return voices.size;}};
  }
  return{create};
});
