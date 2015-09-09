int[][] result;
float t, c;
PImage bg;

float ease(float p) {
  return 3*p*p - 2*p*p*p;
}

float ease(float p, float g) {
  if (p < 0.5) 
    return 0.5 * pow(2*p, g);
  else
    return 1 - 0.5 * pow(2*(1 - p), g);
}

float mn = .5*sqrt(3);

void setup() {
  setup_();
  result = new int[width*height][3];
}

void draw() {
  
  if(!recording){
    t = mouseX*1.0/width;
    c = mouseY*1.0/height;
    if(mousePressed)
        println(c);
    draw_();
  }
  
  else {
  for (int i=0; i<width*height; i++)
    for (int a=0; a<3; a++)
      result[i][a] = 0;

  c = 0;
  for (int sa=0; sa<samplesPerFrame; sa++) {
    t = map(frameCount-1 + sa*shutterAngle/samplesPerFrame, 0, numFrames, 0, 1);
    draw_();
    loadPixels();
    for (int i=0; i<pixels.length; i++) {
      result[i][0] += pixels[i] >> 16 & 0xff;
      result[i][1] += pixels[i] >> 8 & 0xff;
      result[i][2] += pixels[i] & 0xff;
    }
  }

  loadPixels();
  for (int i=0; i<pixels.length; i++)
    pixels[i] = 0xff << 24 | 
      int(result[i][0]*1.0/samplesPerFrame) << 16 | 
      int(result[i][1]*1.0/samplesPerFrame) << 8 | 
      int(result[i][2]*1.0/samplesPerFrame);
  updatePixels();
  }
}

//////////////////////////////////////////////////////////////////////////////

int samplesPerFrame = 8;
int numFrames = 240;        
float shutterAngle = .33;

boolean recording = true;

void setup_() {
  size(1000,600,P3D);
  rectMode(CENTER);
  stroke(250);
  strokeWeight(3.5);
  smooth(8);
  ortho();
  noFill();
  bg = loadImage("installing.png");
}

void ver(float xx, float yy, float zz){
  tt = ease(constrain(1.4*((3*t)%1)-map(yy,-l/2,l/2,0,.4),0,1),2.5);
  vertex(xx*cos(HALF_PI*tt) + zz*sin(HALF_PI*tt), yy, zz*cos(HALF_PI*tt) - xx*sin(HALF_PI*tt));
}

float x, y, z, tt;
float l = 195;
float ww = 1;
float xrot = atan(sqrt(.5));

void draw_() {
  background(bg); 
  pushMatrix();
  translate(width/2, height/2);
  rotateX(xrot);
  rotateY(QUARTER_PI);
  if(3*t<=1)
    rotateX(HALF_PI);
  else if(3*t <= 2)
    rotateZ(HALF_PI);
  
  for(int i=0; i<4; i++){
    for(int j=0; j<4; j++){
      x = map(i,0,3,-l/2,l/2);
      y = map(j,0,3,-l/2,l/2);
      beginShape();
      for(int a=0; a<100; a++){
        z = map(a,0,99,-l/2-ww,l/2+ww);
        ver(x,y,z);
      }
      endShape();
    }
  }
  
  for(int i=0; i<4; i++){
    for(int j=0; j<4; j++){
      x = map(i,0,3,-l/2,l/2);
      z = map(j,0,3,-l/2,l/2);
      beginShape();
      for(int a=0; a<100; a++){
        y = map(a,0,99,-l/2-ww,l/2+ww);
        ver(x,y,z);
      }
      endShape();
    }
  }
  
  for(int i=0; i<4; i++){
    for(int j=0; j<4; j++){
      y = map(i,0,3,-l/2,l/2);
      z = map(j,0,3,-l/2,l/2);
      beginShape();
      for(int a=0; a<100; a++){
        x = map(a,0,99,-l/2-ww,l/2+ww);
        ver(x,y,z);
      }
      endShape();
    }
  }
  popMatrix();
}

