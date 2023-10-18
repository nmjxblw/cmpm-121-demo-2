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

//const paths: any[] = [];

//let currentIndex = paths.length - 1;

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  //currentIndex++;
});

//let path: any[] = [];
canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    ctx!.beginPath();
    ctx!.moveTo(cursor.x, cursor.y);
    ctx!.lineTo(e.offsetX, e.offsetY);
    ctx!.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    //path.push({ x: cursor.x, y: cursor.y });
  }
});

canvas.addEventListener("mouseup", () => {
  //paths.push(path);
  //path = [];
  cursor.active = false;
  //console.log(paths);
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
});
