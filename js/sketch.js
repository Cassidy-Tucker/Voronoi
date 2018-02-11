var resized = false;
var voronoi = new Voronoi();
var sites = createSites(view.size / 150, false);
var rasters = [sites.length];
var groups = [rasters.length];
var images = [
  "image1.jpg",
  "image2.jpg",
  "image3.jpg",
  "image4.jpg",
  "image5.jpg",
  "image6.jpg",
  "image7.jpg",
  "image8.jpg",
  "image9.jpg",
  "image10.jpg"
];
var paths = [];
var bbox, diagram;
var oldSize = view.size;

//------------------------------------------------------------------------------
function init(){
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

  createDiagram();
}

//------------------------------------------------------------------------------
function createSites(size, loose) { //sites = all points
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

//------------------------------------------------------------------------------
function createDiagram(){
  project.activeLayer.children = [];
  diagram = voronoi.compute(sites, bbox);
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

function updateDiagram(){
  project.activeLayer.children = [];
  diagram = voronoi.compute(sites, bbox);
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
          updatePath(points, sites[i]);
        }
      }
    }
  }
}

//------------------------------------------------------------------------------
function createPath(points, center) {
  var path = new Path(); // !!!
  path.fillColor = new Color('black');
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

  paths.push(path);
  createRaster(path, center);

  return path;
}

function updatePath(points, center, id){
  for(var i = 0; i < points.length; i++){
    var point = points[i];
    var next = points[(i + 1) == points.length ? 0 : i + 1]; //future point
    var vector = (next - point) / 2; //direction that next point is moving in slope!
    paths[id].set({
      strokeColor: 'red'
    });
  }
}

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

//------------------------------------------------------------------------------
function createRaster(path, center){
  rasters.push(new Raster("./images/"+images[Math.floor(Math.random()*(images.length))]));
  var group = new Group(path, rasters[rasters.length - 1]);
  group.clipped = true;
  groups.push(group);
  rasters[rasters.length - 1].position = center;
}

function updateRaster(){
  for(var i = 0; i < sites.length; i++){
    rasters[i].position = sites[i];
  }
}

//------------------------------------------------------------------------------
function onResize() {
  if(resized){
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
    updateDiagram();
  }else{
    resized = true;
  }
}

//------------------------------------------------------------------------------
init();
