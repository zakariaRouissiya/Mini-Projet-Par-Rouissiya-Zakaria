let pursuer1, pursuer2;
let target;
let obstacles = [];
let vehicles = [];
let followQueue = true;
let followLeader = true;

function setup() {
    createCanvas(windowWidth, windowHeight);
    pursuer1 = new Vehicle(100, 100, "leader");
    pursuer2 = new Vehicle(random(width), random(height), "follower");

    vehicles.push(pursuer1);
    vehicles.push(pursuer2);

    // Ajouter des véhicules suiveurs supplémentaires
    for (let i = 0; i < 10; i++) {
        vehicles.push(new Vehicle(random(width), random(height), "follower"));
    }

    // Ajouter des obstacles  à l'écran
    obstacles.push(new Obstacle(width / 2, height / 2, 100, "green"));
}

function draw() {
    background(0, 0, 0, 100);

    // La cible est la position de la souris
    target = createVector(mouseX, mouseY);

    // Dessiner la cible 
    fill(255, 0, 0);
    noStroke();
    circle(target.x, target.y, 32);

    // Afficher les obstacles
    obstacles.forEach(o => {
        o.show();
    });

    // Appliquer les comportements à chaque véhicule
    vehicles.forEach((v, index) => {
        if (followLeader && v.role === "leader") {
            // Le leader suit la cible 
            v.applyBehaviors(target, obstacles, vehicles);
        } else {
            if (followQueue && followLeader) {
                // Si l'option "followQueue" est activée, les véhicules suivent dans l'ordre
                v.applyBehaviors(vehicles[index - 1].pos, obstacles, vehicles);
            } else {
                // Sinon, les véhicules suivent toujours la souris
                v.applyBehaviors(target, obstacles, vehicles);
            }
        }
        // Mettre à jour et afficher chaque véhicule
        v.update();
        v.show();
    });
}

// Ajouter un nouvel obstacle à la position de la souris lors du clic
function mousePressed() {
    obstacles.push(new Obstacle(mouseX, mouseY, random(20, 100), "green"));
}

// Gestion des entrées clavier pour ajouter des véhicules et activer/désactiver des comportements
function keyPressed() {
    if (key == "v") {
        // Ajouter un véhicule suiveur
        vehicles.push(new Vehicle(random(width), random(height), "follower"));
    }
    if (key == "d") {
        // Activer/désactiver le mode debug
        Vehicle.debug = !Vehicle.debug;
    } else if (key == "f") {
        // Ajouter des véhicules errants (wanderers)
        for (let i = 0; i < 10; i++) {
            let v = new Vehicle(20, 300, "wander");
            v.vel = new p5.Vector(random(1, 5), random(1, 5));
            vehicles.push(v);
        }
    } else if (key == "l") {
        // Activer/désactiver le suivi du leader et la queue
        followLeader = !followLeader;
        followQueue = followLeader;
    } else if (key == "w") {
        // Ajouter un véhicule errant
        let wanderer = new Vehicle(random(width), random(height), "wander");
        wanderer.wanderTheta = random(TWO_PI);
        vehicles.push(wanderer);
    }
}

// Redimensionner le canevas lorsque la fenêtre change de taille
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}