const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImg = new Image();
playerImg.src="https://i.pinimg.com/736x/ce/58/c1/ce58c1d1278349c500426a7ef0f6908f.jpg";

const enemyImg = new Image();
enemyImg.src="d.png";

/* ---------- GAME OBJECTS ---------- */

let player,enemies,enemyBullets,particles,score,spawnInterval;
const scoreDiv=document.getElementById("score");
const gameOverScreen=document.getElementById("gameOverScreen");

function resetGame(){
  player={
    x:400,y:520,w:150,h:150,
    vx:0,vy:0,tilt:0,
    bullets:[],
    glow:0
  };
  enemies=[];
  enemyBullets=[];
  particles=[];
  score=0;
  scoreDiv.innerText="Score: 0";
  startSpawning();
}

function startSpawning(){
  clearInterval(spawnInterval);
  spawnInterval=setInterval(()=>{
    enemies.push({
      x:Math.random()*(canvas.width-80),
      y:-100,
      w:80,h:80,
      vy:0,
      fire:80+Math.random()*60,
      float:Math.random()*Math.PI*2
    });
  },1600);
}

/* ---------- INPUT ---------- */

const keys={};
document.addEventListener("keydown",e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key===" ") shoot();
});
document.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

function shoot(){
  player.bullets.push({
    x:player.x+player.w/2,
    y:player.y,
    r:7,
    glow:0
  });
}

/* ---------- UPDATE ---------- */

function update(){

  /* player move */
  const tx=(keys["arrowright"]||keys["d"]?6:(keys["arrowleft"]||keys["a"]?-6:0));
  const ty=(keys["arrowdown"]||keys["s"]?6:(keys["arrowup"]||keys["w"]?-6:0));

  player.vx+=(tx-player.vx)*0.15;
  player.vy+=(ty-player.vy)*0.15;

  player.x+=player.vx;
  player.y+=player.vy;
  player.tilt=player.vx*0.04;
  player.glow+=0.1;

  player.x=Math.max(0,Math.min(canvas.width-player.w,player.x));
  player.y=Math.max(0,Math.min(canvas.height-player.h,player.y));

  /* player bullets */
  player.bullets.forEach((b,i)=>{
    b.y-=10;
    b.glow+=0.2;
    if(b.y<-20) player.bullets.splice(i,1);
  });

  /* enemies */
  enemies.forEach((e,i)=>{
    e.vy+=(1.8-e.vy)*0.05;
    e.y+=e.vy;
    e.float+=0.05;

    /* enemy fire */
    e.fire--;
    if(e.fire<0){
      enemyBullets.push({
        x:e.x+e.w/2,
        y:e.y+e.h,
        r:6,
        glow:0
      });
      e.fire=70+Math.random()*60;
    }

    /* player bullet hit enemy */
    player.bullets.forEach((b,j)=>{
      if(hit(b.x,b.y,8,e)){
        enemies.splice(i,1);
        player.bullets.splice(j,1);
        boom(e.x+40,e.y+40);
        score+=10;
        scoreDiv.innerText="Score: "+score;
      }
    });

    if(hitRect(player,e)) gameOver();
  });

  /* enemy bullets → PLAYER HIT BOOM */
  enemyBullets.forEach((b,i)=>{
    b.y+=6;
    b.glow+=0.15;

    if(hit(b.x,b.y,8,player)){
      boom(player.x+player.w/2,player.y+player.h/2);
      gameOver();
    }

    if(b.y>canvas.height) enemyBullets.splice(i,1);
  });

  /* particles */
  particles.forEach((p,i)=>{
    p.x+=p.vx;
    p.y+=p.vy;
    p.a-=0.03;
    if(p.a<=0) particles.splice(i,1);
  });

  draw();
  requestAnimationFrame(update);
}

/* ---------- EFFECTS ---------- */

function boom(x,y){
  for(let i=0;i<25;i++){
    particles.push({
      x,y,
      vx:(Math.random()-0.5)*7,
      vy:(Math.random()-0.5)*7,
      r:2+Math.random()*4,
      a:1
    });
  }
}

/* ---------- COLLISION ---------- */

function hit(px,py,pr,rect){
  return px>rect.x && px<rect.x+rect.w && py>rect.y && py<rect.y+rect.h;
}

function hitRect(a,b){
  return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}

/* ---------- DRAW ---------- */

function draw(){

  ctx.fillStyle="#070b14";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle="rgba(0,255,200,.08)";
  for(let x=0;x<canvas.width;x+=40){
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,canvas.height);
    ctx.stroke();
  }

  /* player */
  ctx.save();
  ctx.translate(player.x+player.w/2,player.y+player.h/2);
  ctx.rotate(player.tilt);
  ctx.shadowBlur=25;
  ctx.shadowColor="#00ffc8";
  ctx.drawImage(playerImg,-player.w/2,-player.h/2,player.w,player.h);
  ctx.restore();

  /* player bullets */
  player.bullets.forEach(b=>{
    const g=ctx.createRadialGradient(b.x,b.y,1,b.x,b.y,15);
    g.addColorStop(0,"#fff");
    g.addColorStop(.4,"#00ffc8");
    g.addColorStop(1,"rgba(0,255,200,0)");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(b.x,b.y,15+Math.sin(b.glow)*4,0,Math.PI*2);
    ctx.fill();
  });

  /* enemies */
  enemies.forEach(e=>{
    ctx.save();
    ctx.translate(e.x+e.w/2,e.y+e.h/2+Math.sin(e.float)*6);
    ctx.shadowBlur=20;
    ctx.shadowColor="#ff3c3c";
    ctx.drawImage(enemyImg,-e.w/2,-e.h/2,e.w,e.h);
    ctx.restore();
  });

  /* enemy bullets */
  enemyBullets.forEach(b=>{
    const g=ctx.createRadialGradient(b.x,b.y,1,b.x,b.y,12);
    g.addColorStop(0,"#fff");
    g.addColorStop(.5,"#ff3c3c");
    g.addColorStop(1,"rgba(255,60,60,0)");
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(b.x,b.y,12+Math.sin(b.glow)*3,0,Math.PI*2);
    ctx.fill();
  });

  /* particles */
  particles.forEach(p=>{
    ctx.globalAlpha=p.a;
    ctx.fillStyle="orange";
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=1;
  });
}

/* ---------- GAME OVER ---------- */

function gameOver(){
  gameOverScreen.style.display="flex";
  clearInterval(spawnInterval);
}

document.getElementById("playAgainBtn").onclick=()=>{
  gameOverScreen.style.display="none";
  resetGame();
};

/* ---------- START ---------- */

resetGame();
update();
