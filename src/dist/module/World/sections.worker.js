({947:function(){(function(){var t,e,a,s,r=function(t,e){return(+t%(e=+e)+e)%e};console.log("SECTIONS WORKER STARTED!"),t=class{constructor(t){var e,a,s;null!==t&&(!t.bitsPerValue>0&&console.error("bits per value must at least 1"),t.bitsPerValue<=32||console.error("bits per value exceeds 32"),s=Math.floor(64/t.bitsPerValue),e=Math.ceil(t.capacity/s),t.data||(t.data=Array(2*e).fill(0)),a=(1<<t.bitsPerValue)-1,this.data=t.data,this.capacity=t.capacity,this.bitsPerValue=t.bitsPerValue,this.valuesPerLong=s,this.valueMask=a)}get(t){var e,a,s,r;return t>=0&&t<this.capacity||console.error("index is out of bounds"),(e=(t-(r=Math.floor(t/this.valuesPerLong))*this.valuesPerLong)*this.bitsPerValue)>=32?(a=e-32,this.data[2*r+1]>>>a&this.valueMask):(s=this.data[2*r]>>>(a=e),a+this.bitsPerValue>32&&(s|=this.data[2*r+1]<<32-a),s&this.valueMask)}length(){return this.data.length/2}getBitsPerValue(){return this.bitsPerValue}},e=class{constructor(t){}getBlockIndex(t){return t.y<<8|t.z<<4|t.x}cvo(t,e,a){var s;return s=0|r(t,16),16*(0|r(e,16))*16+16*(0|r(a,16))+s}computeSections(e){var a,s,r,i,o,n,l,u,c,h,d,v,f,p,b,g;for(h=0,v=[],o=0,u=(f=e.sections).length;o<u;o++)if(h+=1,null!==(i=f[o])){for(i.solidBlockCount,d=i.palette,r=new t(i.data),s=new Uint8Array(4096),a=new Uint8Array(4096),p=n=0;n<=15;p=++n)for(b=l=0;l<=15;b=++l)for(g=c=0;c<=15;g=++c)s[this.cvo(p,b,g)]=d[r.get(this.getBlockIndex({x:p,y:b,z:g}))],a[this.cvo(p,b,g)]=e.biomes[(h+b>>2&63)<<4|(e.z+g>>2&3)<<2|e.x+p>>2&3];v.push({x:e.x,y:h,z:e.z,cell:s,biome:a})}else v.push(null);return v}},addEventListener("message",(function(t){var e;if(!(e=s[t.data.type]))throw new Error("no handler for type: "+t.data.type);e(t.data.data)})),a=new e,s={computeSections:function(t){return postMessage({result:a.computeSections(t)})}}}).call(this)}})[947]();