// inputted

var cities,
    temperature,
    stemperature,
    coolingSpeed,
    epochs;

var canvas;
var citiesArr = []
var connections = []
var unionArr = [];

var canvasWidth
var canvasHeight
var ctx


var bestDistance = Infinity;

var UNIONFIND = (function () {

    function _find(n) {
        if (n.parent === n) return n;
        n.parent = _find(n.parent);
        return n.parent;
    }

    return {
        makeset: function (city) {
            var newnode = {
                city: city,
                parent: null,
                id: (city.x + canvasWidth * city.y) * epochs,
                rank: 0
            };
            newnode.parent = newnode;
            return newnode;
        },

        find: _find,

        combine: function (n1, n2) {
            var n1 = _find(n1);
            var n2 = _find(n2);

            if (n1.rank < n2.rank) {
                n2.parent = n2;
                return n2;
            } else if (n2.rank < n1.rank) {
                n2.parent = n1;
                return n1;
            } else {
                n2.parent = n1;
                n1.rank += 1;
                return n1;
            }
        }
    };
})();

function City(x, y) {
    this.x = x;
    this.y = y;
    this.timesConnected = 0;
    return this
}

function Connection(from, to) {
    this.a = from;
    this.b = to;
    this.distance = function () {
        var x = this.a.city.x - this.b.city.x;
        var y = this.a.city.y - this.b.city.y;

        // console.log("distance: " + Math.sqrt(x * x + y * y))
        return Math.sqrt(x * x + y * y);
    }
    return this
}

function isConnected(from, to) {
    return UNIONFIND.find(from) === UNIONFIND.find(to)
        || from.city.timesConnected >= 2
        || to.city.timesConnected >= 2
        || from === to
}

function generateCities() {
    var maxHeightRandom = function () {
        return Math.random() * canvasHeight;
    };
    var maxWidthRandom = function () {
        return Math.random() * canvasWidth;
    };
    for (let i = 0; i < cities; i++) {
        citiesArr.push(new City(maxWidthRandom(), maxHeightRandom()))
    }
    console.log(citiesArr);
    return citiesArr;
}

function drawCities() {
    for (let city of citiesArr) {
        ctx.fillRect(city.x, city.y, 5, 5);
    }
}

function drawLine(from, to, array) {
    from.city.timesConnected++;
    to.city.timesConnected++;
    UNIONFIND.combine(from, to);

    array.push(new Connection(from, to));
    ctx.beginPath();
    // console.log(from.city.x);
    ctx.moveTo(from.city.x, from.city.y);
    ctx.lineTo(to.city.x, to.city.y);
    ctx.stroke();
}

function drawInitialState() {

    for (let city of citiesArr) {
        unionArr.push(UNIONFIND.makeset(new City(city.x, city.y)))
    }

    for (let unionCity of unionArr) {
        if (unionCity.city.timesConnected < 2) {
            let unionCity2;
            for (let i = 0; i < unionArr.length - 1; i++) {
                unionCity2 = unionArr[i];
                if (!isConnected(unionCity, unionCity2)) {
                    drawLine(unionCity, unionCity2, connections);
                    break;
                }
            }
        }
    }
    for (let unionCity of unionArr) {
        if (unionCity.city.timesConnected < 2) {
            let unionCity2;
            for (let i = 0; i < unionArr.length - 1; i++) {
                unionCity2 = unionArr[i];
                if (!isConnected(unionCity, unionCity2)) {
                    drawLine(unionCity, unionCity2, connections);
                    break;
                }
            }
        }
    }
    // drawLine(unionArr[0], unionArr[citiesArr.length - 1],unionArr);
}


function performAnnealing() {
    function sumDistance(array) {
        let d = 0;
        // console.log("sumDistance")
        for (let conn of array) {
            // console.log(conn)
            d += conn.distance()
        }
        // console.log(d)
        return d;
    }

    function annealing() {
         // console.log("begin anneal")
        if (temperature < 1) {
            // console.log(epochs)
            // console.log(temperature)
            // console.log(stemperature)
            //
            // alert("done")
            return;
        }

        var newConnections = [];

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawCities();
        // console.log(epochs);
        let unionCitya = unionArr[Math.floor(unionArr.length * Math.random())];
        let founda = connections.filter(x => x.a === unionCitya || x.b === unionCitya);
        let unionCityb =
            founda[0].a === unionCitya
                ? founda[0].b
                : founda[0].a;
        let unionCityaS =
            founda[1].a === unionCitya
                ? founda[1].b
                : founda[1].a;
        let foundb = connections.filter(x => x.a === unionCityb || x.b === unionCityb);
        let foundc = foundb.filter(x => x.a !== unionCitya && x.b !== unionCitya)
        // console.log("conns")
        // console.log(connections)

        let unionCityc =
            foundc[0].a === unionCityb
                ? foundc[0].b
                : foundc[0].a;

        var tmp = connections.filter(x => !(x.a === unionCityb || x.b === unionCityb));
        tmp = tmp.filter(x => !(x.a === unionCitya || x.b === unionCitya));
        tmp.push(new Connection(unionCitya, unionCityc));
        tmp.push(new Connection(unionCitya, unionCityb));
        tmp.push(new Connection(unionCityaS, unionCityb));

        let distanceDifference = sumDistance(connections) - sumDistance(tmp);
        // console.log("best:" + bestDistance);

        bestDistance = sumDistance(tmp);

        if (distanceDifference > 0) {
            bestDistance = sumDistance(tmp);
            for (let conn of tmp) {
                drawLine(conn.a, conn.b, newConnections);
            }
            connections = tmp;
        } else if (Math.exp(-Math.abs(distanceDifference) / temperature) > Math.random()) {
            // console.log("mem")
            for (let conn of tmp) {
                drawLine(conn.a, conn.b, newConnections);
            }
            connections = tmp;
        } else {
            for (let conn of connections) {
                drawLine(conn.a, conn.b, newConnections);
            }
        }
        temperature /= coolingSpeed;
        setTimeout(annealing, 1);
    }

    annealing()
}

function init() {
    citiesArr = []
    connections = []
    unionArr = []
    canvas = document.getElementById("canvas");
    canvas.width = 700;
    canvas.height = 700;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    ctx = canvas.getContext("2d");
    ctx.canvas.width = canvasWidth;
    ctx.canvas.height = canvasHeight;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    console.log(canvasWidth)
    cities = document.getElementById("cities").value;
    console.log(cities);
    temperature = document.getElementById("temperature").value;
    console.log(temperature);
    stemperature = document.getElementById("stemperature").value;
    console.log(stemperature);
    coolingSpeed = document.getElementById("cooling").value;
    console.log(coolingSpeed);
    epochs = document.getElementById("epochs").value;
    console.log(epochs);

    generateCities();
    drawCities();
    drawInitialState();
    performAnnealing();
}