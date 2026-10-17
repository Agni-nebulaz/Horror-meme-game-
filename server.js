const express=require('express'),http=require('http'),path=require('path'),{Server}=require('socket.io');
const app=express();app.use(express.static(__dirname));
app.get('/',(q,r)=>r.sendFile(path.join(__dirname,'hollow-house.html')));
const srv=http.createServer(app),io=new Server(srv,{cors:{origin:'*'}}),R={};
const pub=r=>r.p.map(({id,name,ch})=>({id,name,ch}));
const lob=r=>io.to(r.id).emit('lobby',{players:pub(r),host:r.p[0].id,quick:r.q});
function go(r){if(r.s)return;r.s=1;clearTimeout(r.t);io.to(r.id).emit('start',{seed:Math.random()*1e9|0,players:pub(r),host:r.p[0].id})}
io.on('connection',s=>{
 s.on('join',({room,name,ch,quick})=>{let r;
  if(quick){r=Object.values(R).find(x=>x.q&&!x.s&&x.p.length<4);if(!r){const id='Q'+Date.now();r=R[id]={id,q:1,p:[],s:0}}}
  else{const id=String(room||'').toUpperCase().slice(0,6)||'LOBBY';r=R[id]||(R[id]={id,q:0,p:[],s:0});if(r.s||r.p.length>=4)return s.emit('full')}
  s.join(r.id);s.rid=r.id;r.p.push({id:s.id,name:String(name).slice(0,12),ch:ch|0});lob(r);
  if(r.q){if(r.p.length==1)r.t=setTimeout(()=>go(r),8000);if(r.p.length==4)go(r)}});
 s.on('go',()=>{const r=R[s.rid];if(r&&r.p[0].id==s.id)go(r)});
 s.on('in',d=>{const r=R[s.rid];if(r&&r.s)io.to(r.p[0].id).emit('in',{id:s.id,x:+d.x||0,y:+d.y||0})});
 s.on('snap',d=>{const r=R[s.rid];if(r&&r.s&&r.p[0].id==s.id)s.to(r.id).emit('snap',d)});
 s.on('disconnect',()=>{const r=R[s.rid];if(!r)return;const i=r.p.findIndex(p=>p.id==s.id);if(i<0)return;r.p.splice(i,1);
  if(!r.p.length){clearTimeout(r.t);delete R[r.id]}else if(r.s)io.to(r.id).emit(i==0?'lost':'left',s.id);else lob(r)})});
srv.listen(process.env.PORT||3000,()=>console.log('Hollow House server up'));
