
//Declaring all global variables!
var voronoi = new Voronoi();
var sites = generateBeeHivePoints(view.size / 150, false); //generate points for beehive shape
var bbox, diagram; //bounding boxes and diagram to render?
var oldSize = view.size; //
var spotColor = new Color('black');
var mousePos = view.center //
var selected = false; // ?
var rasters = [];


onResize(); //calling this function before all the rest?

//the function to create something to happen when the mouse is clicked
function onMouseDown(event) {
  sites.push(event.point);
  renderDiagram();
}

//the function to have something happen then the mouse moves
function onMouseMove(event) {
  mousePos = event.point; //mouse goes over a point
  if(event.count === 0) //if mouse goes over a point, push the sites over to make room
    sites.push(event.point);
    sites[sites.length - 1] = event.point;
    renderDiagram(); //rerender diagram
}

//the function rendering the shapes and is called repeatedly
function renderDiagram() {
  project.activeLayer.children = [];
  var diagram = voronoi.compute(sites, bbox); //calling voronoi.js and rendering the entire page
  if(diagram) {
    for(var i = 0, l = sites.length; i < l; i++) {
      var cell = diagram.cells[sites[i].voronoiId];
      if(cell) {
        var halfedges = cell.halfedges,
          length = halfedges.length;
        if(length > 2) {
          var points = [];
          for(var j = 0; j < length; j++) {
            v = halfedges[j].getEndpoint();
            points.push(new Point(v));
          }
          createPath(points, sites[i]);
        }
      }
    }
  }
}

// function to make shapes with smooth edges (not extreme!)
function removeSmallBits(path) {
  var averageLength = path.length / path.segments.length;
  var min = path.length / 50;
  for(var i = path.segments.length - 1; i >= 0; i--) {
    var segment = path.segments[i];
    var cur = segment.point;
    var nextSegment = segment.next;
    var next = nextSegment.point + nextSegment.handleIn;
    if(cur.getDistance(next) < min) {
      segment.remove();
    }
  }
}

// the function to determine and generate points
function generateBeeHivePoints(size, loose) { //sites = all points
  var points = [];
  var col = view.size / size; //window size height + width
  for(var i = -1; i < size.width + 1; i++) {
    for(var j = -1; j < size.height + 1; j++) {
      var point = new Point(i, j) / new Point(size) * view.size + col / 2;
      if(j % 2)
        point += new Point(col.width / 2, 0);
      if(loose) //loose means no rigid structure
        point += (col / 4) * Point.random() - col / 4;
      points.push(point);
    }
  }
  return points;
}

//function to create paths between shapes (each new path assign new classname & set background img to any random img)
function createPath(points, center) {
  var path = new Path();
  if(!selected) { //fills shapes with color if not selected
    rasters.push(new Raster("https://loremflickr.com/320/240"));
    var group = new Group(path, rasters[rasters.length]);
    group.clipped = true;

    rasters.position = path.position;

    path.fillColor = spotColor;
  } else {
    path.fullySelected = selected; //selected means that paths will show
  }
  path.closed = true;

  for(var i = 0; i < points.length; i++) {
    var point = points[i]; //point origin
    var next = points[(i + 1) == points.length ? 0 : i + 1]; //future point
    var vector = (next - point) / 2; //direction that next point is moving in slope!
    path.add({
      point: point + vector,
      handleIn: -vector,
      handleOut: vector
    });
  }
  path.scale(0.95);
  removeSmallBits(path);
  return path;
}

function onResize() {
  var margin = 20;
  bbox = {
    xl: margin,
    xr: view.bounds.width - margin,
    yt: margin,
    yb: view.bounds.height - margin
  };
  for(var i = 0, l = sites.length; i < l; i++) {
    sites[i] = sites[i] * view.size / oldSize;
  }
  oldSize = view.size;
  renderDiagram();
}

function onKeyDown(event) {
  if(event.key == 'space') {
    selected = !selected;
    renderDiagram();
  }
}
