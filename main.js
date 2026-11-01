import charts from './chart.js';

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scrollSpeed = 0.5;

const base = new Path2D();
base.arc(300, 300, 50, 0, Math.PI * 2);

let level, notes, start = false;
let mouseX, mouseY;

const hitQueue = [];
const judgements = [0, 0, 0, 0];
let combo = 0;

const getMouseAngle = () => {
  let angle = Math.atan(-(mouseX - 300) / (mouseY - 300 || 1e-9));
  if (mouseY >= 300) angle += Math.PI;
  if (angle < 0) angle += Math.PI * 2;

  return angle;
};

const angleDiff = (angle1, angle2) => {
  return Math.min(Math.abs(angle1 - angle2), Math.PI * 2 - Math.abs(angle1 - angle2));
};

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

  const now = document.getElementById(charts[level].audio).currentTime * 1000;
  notes.forEach(note => {
    const t = note.time * 60 * 1000 / charts[level].bpm + charts[level].offset;
    if (now - t >= 200 && !note.inactive) {
      notes[notes.indexOf(note)].inactive = true;
      judgements[3]++;
      combo = 0;
    } else if (now - t <= 50 && !note.inactive) {
      ctx.fillStyle = `rgb(${note.type == "tap" ? "0 0 255" : "170 170 255"} / ${Math.min(100, 100 - 2 * (now - t))}%)`;
      const dist = scrollSpeed * note.speed * (now - t) - 50;
      const circle = new Path2D();
      circle.arc(
        300 - dist * Math.sin(note.angle * Math.PI / 180),
        300 + dist * Math.cos(note.angle * Math.PI / 180),
        10, 0, Math.PI * 2
      );
      ctx.fill(circle);

      if (note.type == "drag" && now - t >= -50 && angleDiff(getMouseAngle(), note.angle * Math.PI / 180) <= Math.PI / 6) {
        note.inactive = true;
        judgements[0]++;
        hitQueue.push([now, note.angle * Math.PI / 180, 0]);
        combo++;
      }
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

  if (level == "terabyteEasy" || level == "terabyteHard") {
    if (now >= 2000 && now <= 6000) {
      ctx.font = "16px Times New Roman";
      ctx.fillStyle = `rgb(0 0 0 / ${Math.min(100, 400 - Math.abs(now - 4000) / 5)}%)`;
      ctx.fillText("Hit each note when its center match the border of the green circle", 100, 183);
    }

    if (now >= 7000 && now <= 11000) {
      ctx.font = "16px Times New Roman";
      ctx.fillStyle = `rgb(0 0 0 / ${Math.min(100, 400 - Math.abs(now - 9000) / 5)}%)`;
      ctx.fillText("Use your mouse to aim in the direction the notes are coming in", 110, 183);
    }

    if (now >= 12000 && now <= 16000) {
      ctx.font = "16px Times New Roman";
      ctx.fillStyle = `rgb(0 0 0 / ${Math.min(100, 400 - Math.abs(now - 14000) / 5)}%)`;
      ctx.fillText("You may use your mouse or your keyboard to hit notes", 130, 183);
    }
  }

  if (now >= charts[level].end) {
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
    let credits = `${charts[level].name} by ${charts[level].artist}`;
    ctx.fillText(credits, 300 - credits.length * 5, 410);
    ctx.fillText("partially inspired by Beatblock", 195, 430);
  }

  window.requestAnimationFrame(draw);
}

const tap = e => {
  if (!start) {
    start = true;
    level = document.getElementById("songSelect").value;
    notes = charts[level].chart;
    document.getElementById(charts[level].audio).play();
    window.requestAnimationFrame(draw);
    return;
  }

  let angle = getMouseAngle();
  let closestNote = null, closestTime = 200, closestAngle = Math.PI / 6;
  const now = document.getElementById(charts[level].audio).currentTime * 1000;
  notes.forEach(note => {
    if (note.inactive || note.type != "tap") return;
    const dt = Math.abs(now - note.time * 60 * 1000 / charts[level].bpm - charts[level].offset);
    const da = angleDiff(angle, note.angle * Math.PI / 180);
    if ((dt < closestTime || dt == closestTime && da < closestAngle) && da <= Math.PI / 6) {
      closestNote = note;
      closestTime = dt;
      closestAngle = da;
    }
  });
  if (closestNote) {
    notes[notes.indexOf(closestNote)].inactive = true;
    if (closestTime <= 50) {
      judgements[0]++;
      hitQueue.push([now, closestNote.angle * Math.PI / 180, 0]);
    } else if (closestTime <= 100) {
      judgements[1]++;
      hitQueue.push([now, closestNote.angle * Math.PI / 180, 1]);
    } else if (closestTime <= 150) {
      judgements[2]++;
      hitQueue.push([now, closestNote.angle * Math.PI / 180, 2]);
    } else judgements[3]++;
    combo = closestTime <= 150 ? combo + 1 : 0;
  }
};

canvas.addEventListener("mousemove", e => {
  mouseX = e.offsetX;
  mouseY = e.offsetY;
});

canvas.addEventListener("mousedown", tap);

window.addEventListener("keydown", e => {
  canvas.dispatchEvent(new MouseEvent("mousedown"));
});

ctx.fillStyle = "rgb(0 255 0)";
ctx.fill(base);
ctx.fillStyle = "rgb(0 0 0)";
ctx.font = "16px Times New Roman";
ctx.fillText("Click to start", 258, 308);