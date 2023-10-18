import "./style.css";
("use strict");

const app: HTMLDivElement = document.querySelector("#app")!;

//test line
const gameName = "Zhuo's game";

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

//step1
//setp2
const canvas = document.createElement("canvas");
const canvasScale = 256;
canvas.width = canvasScale;
canvas.height = canvasScale;
canvas.style.border = "thin solid black";
canvas.style.borderRadius = "20px";
canvas.style.filter = "drop-shadow(0 0 1px crimson)";
app.append(document.createElement("br"));
document.body.append(canvas);
const ctx = canvas.getContext("2d");
ctx!.fillStyle = "white";

const cursor = { active: false, x: 0, y: 0 };

interface Point {
  x: number;
  y: number;
}

type Line = Point[] | undefined;

const lines: Line[] = [];
const redoLines: Line[] = [];

let currentLine: Line = [];

const firstIndex = 0; //magic number
const origin: Point = { x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  redoLines.splice(firstIndex, redoLines.length);
  const lineStartPoint: Point = { x: cursor.x, y: cursor.y };
  currentLine.push(lineStartPoint);

  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    const movePoint: Point = { x: cursor.x, y: cursor.y };
    currentLine!.push(movePoint);

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = [];

  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

//step3
canvas.addEventListener("drawing-changed", () => {
  redraw();
});

function redraw() {
  ctx!.clearRect(origin.x, origin.y, canvas.width, canvas.height);
  for (const line of lines) {
    if (line!.length) {
      ctx!.beginPath();
      const { x, y } = line![firstIndex];
      ctx!.moveTo(x, y);
      for (const { x, y } of line!) {
        ctx!.lineTo(x, y);
      }
      ctx!.stroke();
    }
  }
  //console.log(lines);
}

//short cut
function newLine() {
  document.body.append(document.createElement("br"));
}
newLine();

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  lines.splice(firstIndex, lines.length);
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

newLine();
//step4
const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (lines.length) {
    const lastLine: Line = lines.pop();
    redoLines.push(lastLine);
  }
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

newLine();
const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoLines.length) {
    const lastRedoLine: Line = redoLines.pop();
    lines.push(lastRedoLine);
  }
  canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});
