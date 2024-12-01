class Vehicle {
    static debug = false;

    constructor(x, y, role = "follower") {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = 6;
        this.maxForce = 0.25;
        this.color = role === "leader" ? "red" : "white";
        this.r_pourDessin = 16;
        this.r = this.r_pourDessin * 3;
        this.role = role;
        this.wanderTheta = random(TWO_PI);
        this.path = [];
        this.pathMaxLength = 30;
        this.largeurZoneEvitementDevantVaisseau = this.r / 2;
    }

    // Méthode pour suivre une cible
    seek(target) {
        let desired = p5.Vector.sub(target, this.pos);
        let distance = desired.mag();
        desired.normalize();
        if (distance < 100) {
            let speed = map(distance, 0, 100, 0, this.maxSpeed);
            desired.setMag(speed);
        } else {
            desired.setMag(this.maxSpeed);
        }
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    // Méthode pour fuir un obstacle
    fleeFromObstacle(obstacles) {
        let fleeForce = createVector(0, 0);
        for (let obstacle of obstacles) {
            let d = p5.Vector.dist(this.pos, obstacle.pos);
            if (d < obstacle.r + this.r) {
                let diff = p5.Vector.sub(this.pos, obstacle.pos);
                diff.normalize();
                diff.div(d);
                fleeForce.add(diff);
            }
        }
        fleeForce.limit(this.maxForce);
        return fleeForce;
    }

    // Méthode pour éviter les autres véhicules proches
    separate(vehicles) {
        let desiredSeparation = 50;
        let steer = createVector(0, 0);
        let count = 0;
        for (let other of vehicles) {
            let d = p5.Vector.dist(this.pos, other.pos);
            if (d > 0 && d < desiredSeparation) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.normalize();
                diff.div(d);
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) {
            steer.div(count);
        }
        if (steer.mag() > 0) {
            steer.normalize();
            steer.mult(this.maxSpeed);
            steer.sub(this.vel);
            steer.limit(this.maxForce);
        }
        return steer;
    }

    // Méthode pour un comportement errant
    wander() {
        let wanderRadius = 100;
        let wanderDistance = 200;
        let circleCenter = this.vel.copy();
        circleCenter.setMag(wanderDistance);
        let h = this.wanderTheta + random(-0.5, 0.5);
        let target = createVector(wanderRadius * cos(h), wanderRadius * sin(h));
        target.add(circleCenter);
        this.wanderTheta = h;
        return this.seek(target);
    }

    // Méthode pour éviter les bords de l'écran
    boundaries() {
        const d = 25;
        let desired = null;

        if (this.pos.x < d) {
            desired = createVector(this.maxSpeed, this.vel.y);
        } else if (this.pos.x > width - d) {
            desired = createVector(-this.maxSpeed, this.vel.y);
        }
        if (this.pos.y < d) {
            desired = createVector(this.vel.x, this.maxSpeed);
        } else if (this.pos.y > height - d) {
            desired = createVector(this.vel.x, -this.maxSpeed);
        }

        if (desired !== null) {
            desired.normalize();
            desired.mult(this.maxSpeed);
            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(this.maxForce);
            return steer;
        }
        return createVector(0, 0);
    }

    // Appliquer les comportements
    applyBehaviors(target, obstacles, vehicles) {
        let seekForce = this.seek(target);
        let avoidForce = this.avoid(obstacles);
        let separateForce = this.separate(vehicles);
        let wanderForce = this.wander();
        let boundaryForce = this.boundaries();

        seekForce.mult(1);
        avoidForce.mult(3);
        separateForce.mult(1.5);
        wanderForce.mult(0.5);
        boundaryForce.mult(1);

        this.applyForce(seekForce);
        this.applyForce(avoidForce);
        this.applyForce(separateForce);
        this.applyForce(wanderForce);
        this.applyForce(boundaryForce);
    }

    // Appliquer une force au véhicule
    applyForce(force) {
        this.acc.add(force);
    }

    // Mettre à jour la position du véhicule
    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.ajoutePosAuPath();
    }

    ajoutePosAuPath() {
        this.path.push(this.pos.copy());
        if (this.path.length > this.pathMaxLength) {
            this.path.shift();
        }
    }

    // Afficher le véhicule
    show() {
        this.drawPath();
        this.drawVehicle();
    }

    drawVehicle() {
        stroke(255);
        strokeWeight(2);
        fill(this.color);
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        triangle(-this.r_pourDessin, -this.r_pourDessin / 2, -this.r_pourDessin, this.r_pourDessin / 2, this.r_pourDessin, 0);
        if (Vehicle.debug) {
            stroke(255);
            noFill();
            circle(0, 0, this.r);
        }
        pop();
        this.drawVector(this.pos, this.vel, color(255, 0, 0));
        if (Vehicle.debug) {
            stroke(255);
            noFill();
            circle(this.pos.x, this.pos.y, this.r);
        }
    }

    drawPath() {
        push();
        stroke(255);
        noFill();
        strokeWeight(1);
        fill(this.color);
        this.path.forEach((p, index) => {
            if (!(index % 5)) {
                circle(p.x, p.y, 1);
            }
        });
        pop();
    }

    drawVector(base, vec, color) {
        push();
        stroke(color);
        strokeWeight(2);
        fill(color);
        translate(base.x, base.y);
        line(0, 0, vec.x, vec.y);
        pop();
    }

    static findProjection(pos, a, b) {
        let v1 = p5.Vector.sub(a, pos);
        let v2 = p5.Vector.sub(b, pos);
        v2.normalize();
        let sp = v1.dot(v2);
        v2.mult(sp);
        v2.add(pos);
        return v2;
    }

    avoid(obstacles) {
        let ahead = this.vel.copy();
        ahead.mult(50);
        let ahead2 = ahead.copy();
        ahead2.mult(0.5);

        if (Vehicle.debug) {
            this.drawVector(this.pos, ahead, "yellow");
            this.drawVector(this.pos, ahead2, "blue");
        }

        let pointAuBoutDeAhead = this.pos.copy().add(ahead);
        let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);

        let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

        if (obstacleLePlusProche == undefined) {
            return createVector(0, 0);
        }

        let distance = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
        let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
        let distance3 = this.pos.dist(obstacleLePlusProche.pos);

        if (Vehicle.debug) {
            fill(255, 0, 0);
            circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
            fill(0, 255, 0);
            circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);
            stroke(100, 100);
            strokeWeight(this.largeurZoneEvitementDevantVaisseau);
            line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
        }

        distance = min(distance, distance2);
        distance = min(distance, distance3);

        if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
            let desiredVelocity;
            if (distance == distance2) {
                desiredVelocity = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
            } else if (distance == distance3) {
                desiredVelocity = p5.Vector.sub(this.pos, obstacleLePlusProche.pos);
            } else {
                desiredVelocity = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
            }

            if (Vehicle.debug) {
                this.drawVector(obstacleLePlusProche.pos, desiredVelocity, "yellow");
            }

            desiredVelocity.setMag(this.maxSpeed);
            let force = p5.Vector.sub(desiredVelocity, this.vel);
            force.limit(this.maxForce);
            return force;
        } else {
            return createVector(0, 0);
        }
    }

    getObstacleLePlusProche(obstacles) {
        let plusPetiteDistance = 100000000;
        let obstacleLePlusProche = undefined;

        obstacles.forEach(o => {
            const distance = this.pos.dist(o.pos);
            if (distance < plusPetiteDistance) {
                plusPetiteDistance = distance;
                obstacleLePlusProche = o;
            }
        });

        return obstacleLePlusProche;
    }
}
