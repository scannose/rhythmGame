import { terabyte } from './chart.js';

const notes = terabyte.map(note => note.concat(note.length == 3 ? [false] : [1, false]));

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scrollSpeed = 0.5;
const bpm = 230;

const base = new Path2D();
base.arc(300, 300, 50, 0, Math.PI * 2);

const hitQueue = [];
const judgements = [0, 0, 0, 0];
let combo = 0;
let start = false;

function draw() {
  ctx.clearRect(0, 0, 600, 600);
  ctx.fillStyle = "rgb(0 255 0)";
  ctx.fill(base);
  ctx.fillStyle = "rgb(0 0 0)";
  ctx.font = "16px Times New Roman";
  ctx.fillText(String(judgements[0] * 300 + judgements[1] * 200 + judgements[2] * 100).padStart(7, '0'), 272, 308);
  ctx.fillText("Combo", 280, 78)
  ctx.font = "24px Times New Roman";
  ctx.fillText(String(combo).padStart(3, '0'), 285, 62)

  const now = document.getElementById("audio").currentTime * 1000;
  ctx.fillStyle = "rgb(0 0 255)";
  notes.forEach(note => {
    const t = note[0] * 60 * 1000 / bpm;
    if (now - t >= 200 && !note[3]) {
      notes[notes.indexOf(note)][3] = true;
      judgements[3]++;
      combo = 0;
    }
    if (now - t <= 50 && !note[3]) {
      const dist = scrollSpeed * note[2] * (now - t) - 50;
      const circle = new Path2D();
      circle.arc(
        300 - dist * Math.sin(note[1] * Math.PI / 180),
        300 + dist * Math.cos(note[1] * Math.PI / 180),
        10, 0, Math.PI * 2
      );
      ctx.fill(circle);
    }
  });

  for (let i = 0; i < hitQueue.length; i++) {
    if (now - hitQueue[i][0] >= 300) {
      hitQueue.shift();
      i--;
      continue;
    }

    ctx.fillStyle = `rgb(${["255 255 0", "0 255 255", "255 0 0"][hitQueue[i][2]]} / ${100 - (now - hitQueue[i][0]) / 3}%)`;
    ctx.beginPath();
    ctx.moveTo(300 + 50 * Math.sin(hitQueue[i][1] - (0.2 - (now - hitQueue[i][0]) / 1500)), 300 - 50 * Math.cos(hitQueue[i][1] - (0.2 - (now - hitQueue[i][0]) / 1500)));
    ctx.quadraticCurveTo(300 + 67 * Math.sin(hitQueue[i][1]), 300 - 67 * Math.cos(hitQueue[i][1]), 300 + (Math.sqrt((now - hitQueue[i][0]) * 100) + 50) * Math.sin(hitQueue[i][1]), 300 - (Math.sqrt((now - hitQueue[i][0]) * 100) + 50) * Math.cos(hitQueue[i][1]));
    ctx.quadraticCurveTo(300 + 67 * Math.sin(hitQueue[i][1]), 300 - 67 * Math.cos(hitQueue[i][1]), 300 + 50 * Math.sin(hitQueue[i][1] + (0.2 - (now - hitQueue[i][0]) / 1500)), 300 - 50 * Math.cos(hitQueue[i][1] + (0.2 - (now - hitQueue[i][0]) / 1500)));
    ctx.fill();
  }

  if (now >= 37500) {
    ctx.font = "20px Times New Roman";
    ctx.fillStyle = "rgb(255 255 0)";
    ctx.fillText(`Perfect: ${judgements[0]}`, 260, 130);
    ctx.fillStyle = "rgb(0 255 255)";
    ctx.fillText(`Good: ${judgements[1]}`, 260, 150);
    ctx.fillStyle = "rgb(255 0 0)";
    ctx.fillText(`Bad: ${judgements[2]}`, 260, 170);
    ctx.fillStyle = "rgb(0 0 0)";
    ctx.fillText(`Miss: ${judgements[3]}`, 260, 190);
    ctx.fillStyle = (judgements[2] + judgements[3] == 0 ? (judgements[1] == 0 ? "rgb(255 255 0)" : "rgb(0 255 255)") : (judgements[3] == 0 ? "rgb(255 0 0)" : "rgb(0 0 0)"));
    ctx.fillText(`Accuracy: ${((300 * judgements[0] + 200 * judgements[1] + 100 * judgements[2]) / judgements.reduce((x, y) => x + y * 3, 0)).toFixed(2)}%`, 230, 230);
    ctx.fillStyle = "rgb(0 0 0)";
    ctx.fillText("+ERABY+E CONNEC+10N by Camellia", 150, 410);
    ctx.fillText("partially inspired by Beatblock", 200, 430);
  }

  window.requestAnimationFrame(draw);
}

canvas.addEventListener("click", e => {
  if (!start) {
    start = true;
    window.requestAnimationFrame(draw);
    document.getElementById("audio").currentTime = 12;
    document.getElementById("audio").play();
    return;
  }

  let angle = Math.atan(-(e.offsetX - 300) / (e.offsetY - 300 || 1e-9));
  if (e.offsetY >= 300) angle += Math.PI;
  if (angle < 0) angle += Math.PI * 2;

  let closestNote = null, closestTime = 200, closestAngle = Math.PI / 3;
  const now = document.getElementById("audio").currentTime * 1000;
  notes.forEach(note => {
    if (note[3]) return;
    const dt = Math.abs(now - note[0] * 60 * 1000 / bpm);
    const da = Math.min(Math.abs(angle - note[1] * Math.PI / 180), Math.PI * 2 - Math.abs(angle - note[1] * Math.PI / 180));
    if ((dt < closestTime || dt == closestTime && da < closestAngle) && da <= Math.PI / 3) {
      closestNote = note;
      closestTime = dt;
      closestAngle = da;
    }
  });
  if (closestNote) {
    notes[notes.indexOf(closestNote)][3] = true;
    if (closestTime <= 50) {
      judgements[0]++;
      hitQueue.push([now, closestNote[1] * Math.PI / 180, 0]);
    } else if (closestTime <= 100) {
      judgements[1]++;
      hitQueue.push([now, closestNote[1] * Math.PI / 180, 1]);
    } else if (closestTime <= 160) {
      judgements[2]++;
      hitQueue.push([now, closestNote[1] * Math.PI / 180, 2]);
    } else judgements[3]++;
    combo = closestTime <= 160 ? combo + 1 : 0;
  }
});

ctx.fillStyle = "rgb(0 255 0)";
ctx.fill(base);
ctx.fillStyle = "rgb(0 0 0)";
ctx.font = "16px Times New Roman";
ctx.fillText("Click to start", 258, 308);