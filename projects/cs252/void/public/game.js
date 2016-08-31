
/* CS252 Lab6: HTML5 Webapp
 * "Void"
 * Nathan Scott, Jacob Stucky, Jacob McKesson
 * 
 * game based off of a tutorial found on http://jlongster.com/Making-Sprite-based-Games-with-Canvas
 */

// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 1366;
canvas.height = 768;
document.body.appendChild(canvas);

// The main game loop
var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
};

function init() {
    terrainPattern = ctx.createPattern(resources.get('images/background.png'), 'repeat');

    document.getElementById('play-again').addEventListener('click', function() {
        reset();
    });

    reset();
    lastTime = Date.now();
    main();
}

resources.load([
    'images/sprites.png',
    'images/background.png'
]);
resources.onReady(init);

var playerHeight = 39;
var playerWidth = 39;

var enemyHeight = 75;
var enemyWidth = 92;

var smallEnemyHeight = 37;
var smallEnemyWidth = 44;

var bulletHeight = 15;
var bulletWidth = 15;

var powerupHeight = 33;
var powerupWidth = 35;

var info = "";
var infoEl = document.getElementById('info');

var lives = 3;
var livesEl = document.getElementById('lives');

var timeAliveTag = "Time Alive: ";
var timeAliveTagEl = document.getElementById('timeAliveTag');
var scoreTag = "Score: ";
var scoreTagEl = document.getElementById('scoreTag');
var powerupTag = "Powerup: ";
var powerupTagEl = document.getElementById('powerupTag');
var livesTag = "Lives: ";
var livesTagEl = document.getElementById('livesTag');

// Game state
var player = {
    pos: [canvas.width/2, canvas.height/2],
    sprite: new Sprite('images/sprites.png', [0, 0], [playerWidth, playerHeight])
};

var bullets = [];
var enemies = [];
var powerups = [];

var lastFire = Date.now();
var lastAllFire = Date.now();

var gameTime = 0;
var isGameOver;
var terrainPattern;

var timeAlive = 0;
var timeAliveEl = document.getElementById('timeAlive');

var score = 0;
var scoreEl = document.getElementById('score');

var powerup = "None";
var powerupEl = document.getElementById('powerup');

var wave = 0;
var waveEl = document.getElementById('wave');
var waveTag = "Wave: ";
var waveTagEl = document.getElementById('waveTag');

// Speed in pixels per second
var playerSpeed = 200;
var bulletSpeed = 500;
var enemySpeed = 80;
var smallEnemySpeed = 100;

var paused = 0;

var hudToggle = 1;

var maxEnemyCountReached = 1;
var enemyMaxWave = 10;
var timeBetweenWaves = 20000; //20s
var waveStart = Date.now();
var waveScoreBonus = 0;
//var enemiesSpawned = 0;

var lotterySpawnEnemy;

function submitScore(id){
      console.log('submitScore clicked');
      console.log("id: " + id);
      var data = {};
      data.score = score;
      data.id = id ;
      console.log("Carrying out function");
        
      $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: 'http://void.mybluemix.net/update_score',            
        success: function(data) {
          console.log('success');
          console.log(JSON.stringify(data));
        }
      });
    };
// Update game objects
function update(dt) {
    if (!paused) {
      gameTime += dt;
      timeAlive = gameTime.toFixed(1);      
    }

    handleInput(dt);

    if (!paused) {
      updateEntities(dt);

/*    console.log(enemies);
    console.log(enemies.length);*/

      //if all enemies eliminated or time runs out, the next wave starts
      if ((enemies.length == 0 && maxEnemyCountReached) || ((Date.now() - waveStart) > timeBetweenWaves)) {
        //if ((Date.now() - waveStart) > timeBetweenWaves) console.log("here's your problem");
        wave++;
        maxEnemyCountReached = 0;
        score += waveScoreBonus;
        waveStart = Date.now();
        timeBetweenWaves += 10000;
        waveScoreBonus += 1000;
        enemyMaxWave += 3;
        enemySpeed += 5;
        smallEnemySpeed += 7;
/*        info = "Wave " + wave + " info: " + timeBetweenWaves/1000 + 
          " seconds to eliminate " + enemyMaxWave + " enemies. Wave bonus: " + waveScoreBonus;*/
      }

      if (enemies.length == enemyMaxWave){
        maxEnemyCountReached = 1;
        //console.log("that's it for this round");
      }

      // It gets harder over time by adding enemies using this
      // equation: 1-.999^gameTime 993 was original
      lotterySpawnEnemy = Math.random();
      if((lotterySpawnEnemy < 0.1) && !maxEnemyCountReached) {
        //enemiesSpawned++;
          //direction (enemy) sprite moves in degrees
          //  where 0 is upwards, 90 is right, 180 is downwards, 270 is left
          var dir = Math.random() * 360;
          if (dir >= 0 && dir < 45) dir = 0;
          if (dir >= 45 && dir < 90) dir = 45;
          if (dir >= 90 && dir < 135) dir = 90;
          if (dir >= 135 && dir < 180) dir = 135;
          if (dir >= 180 && dir < 225) dir = 180;
          if (dir >= 225 && dir < 270) dir = 225;
          if (dir >= 270 && dir < 315) dir = 270;
          if (dir >= 315 && dir < 360) dir = 315;
          if (dir == 360) dir = 0;

          var side = Math.random() * 4; //determines which side unit spawns from
          var finalSpawnPos;

          if (side >= 0 && side < 1) { //spawns from top of screen
            var spawnPositionX = Math.random() * canvas.width; //determines where on the x axis the unit spawns
            finalSpawnPos = [spawnPositionX, -enemyHeight];
            //now to ensure enemy doesnt stay outside screen
            if (dir == 0 || dir == 90 || dir == 270) dir = 180;
            if (dir == 45) dir = 225;
            if (dir == 315) dir = 135;
          }
          if (side >= 1 && side < 2) { //spawns from right side of screen
            var spawnPositionY = Math.random() * canvas.height; //determines where on the y axis the unit spawns
            finalSpawnPos = [canvas.width, spawnPositionY];
            //now to ensure enemy doesnt stay outside screen
            if (dir == 0 || dir == 90 || dir == 180) dir = 270;
            if (dir == 45) dir = 225;
            if (dir == 135) dir = 315;
          }
          if (side >= 2 && side < 3) { //spawns from bottom of screen
            var spawnPositionX = Math.random() * canvas.width; //determines where on the x axis the unit spawns
            finalSpawnPos = [spawnPositionX, canvas.height];
            //now to ensure enemy doesnt stay outside screen
            if (dir == 90 || dir == 180 || dir == 270) dir = 0;
            if (dir == 135) dir = 315;
            if (dir == 225) dir = 45;
          }
          if (side >= 3 && side <= 4) { //spawns from left side of screen
            var spawnPositionY = Math.random() * canvas.height; //determines where on the y axis the unit spawns
            finalSpawnPos = [-enemyWidth, spawnPositionY];
            //now to ensure enemy doesnt stay outside screen
            if (dir == 0 || dir == 180 || dir == 270) dir = 90;
            if (dir == 225) dir = 45;
            if (dir == 315) dir = 135;
          }

          if (lotterySpawnEnemy < 0.03) {
            enemies.push({
              pos: finalSpawnPos,
              dir: dir,
              isLarge: true,
              sprite: new Sprite('images/sprites.png', [44, 73], [enemyWidth, enemyHeight])
            });
          }

          if (lotterySpawnEnemy >= 0.07) {
            enemies.push({
              pos: finalSpawnPos,
              dir: dir,
              isLarge: false,
              sprite: new Sprite('images/sprites.png', [0, 73], [smallEnemyWidth, smallEnemyHeight])
            });
          }

        }
    

      checkCollisions();
    }
    if (hudToggle) {
      timeAliveTagEl.innerHTML = timeAliveTag;
      timeAliveEl.innerHTML = timeAlive;
      livesTagEl.innerHTML = livesTag;
      livesEl.innerHTML = lives;
      powerupTagEl.innerHTML = powerupTag;
      powerupEl.innerHTML = powerup;
      infoEl.innerHTML = info;
      waveTagEl.innerHTML = waveTag;
      waveEl.innerHTML = wave;
      scoreTagEl.innerHTML = scoreTag;
      scoreEl.innerHTML = score;
    }

};

var bulletDelay = 100;
var playerMovementDirection; //keeps track of player's movement direction (which way is up)
//deals with input
//  up, down, left, right keys fire up, down, left, and right, respectively,
//  w,a,s,d keys move the ship up, left, down, and right respectively
function handleInput(dt) {
  if (!paused) {
    //movement keys
      if(input.isDown('s')) {
          player.pos[1] += playerSpeed * dt;
          playerMovementDirection = 180;
      }

      if(input.isDown('w')) {
          player.pos[1] -= playerSpeed * dt;
          playerMovementDirection = 0;
      }

      if(input.isDown('a')) {
          player.pos[0] -= playerSpeed * dt;
          playerMovementDirection = 270;
      }

      if(input.isDown('d')) {
          player.pos[0] += playerSpeed * dt;
          playerMovementDirection = 90;
      }
      if(input.isDown('w') && input.isDown('d')) playerMovementDirection = 45;
      if(input.isDown('s') && input.isDown('d')) playerMovementDirection = 135;
      if(input.isDown('s') && input.isDown('a')) playerMovementDirection = 225;
      if(input.isDown('w') && input.isDown('a')) playerMovementDirection = 315;

    //shooting keys
      
      if(input.isDown('UP') && !isGameOver && Date.now() - lastFire > bulletDelay) {
        var x = player.pos[0] + player.sprite.size[0] / 2;
          var y = player.pos[1] + player.sprite.size[1] / 2;

          bullets.push({ pos: [x, y],
                         dir: 'up',
                         sprite: new Sprite('images/sprites.png', [0, 40], [bulletWidth, bulletHeight]) });

          lastFire = Date.now();
      }
      
      if(input.isDown('LEFT') && !isGameOver && Date.now() - lastFire > bulletDelay) {
        var x = player.pos[0] + player.sprite.size[0] / 2;
          var y = player.pos[1] + player.sprite.size[1] / 2;

          bullets.push({ pos: [x, y],
                         dir: 'left',
                         sprite: new Sprite('images/sprites.png', [0, 40], [bulletWidth, bulletHeight]) });

          lastFire = Date.now();
      }
      
      if(input.isDown('DOWN') && !isGameOver && Date.now() - lastFire > bulletDelay) {
        var x = player.pos[0] + player.sprite.size[0] / 2;
          var y = player.pos[1] + player.sprite.size[1] / 2;

          bullets.push({ pos: [x, y],
                         dir: 'down',
                         sprite: new Sprite('images/sprites.png', [0, 40], [bulletWidth, bulletHeight]) });

          lastFire = Date.now();
      }
      
      if(input.isDown('RIGHT') && !isGameOver && Date.now() - lastFire > bulletDelay) {
        var x = player.pos[0] + player.sprite.size[0] / 2;
          var y = player.pos[1] + player.sprite.size[1] / 2;

          bullets.push({ pos: [x, y],
                         dir: 'right',
                         sprite: new Sprite('images/sprites.png', [0, 40], [bulletWidth, bulletHeight]) });

          lastFire = Date.now();
      }

      //quadfire
      if((input.isDown('UP') || input.isDown('DOWN') || input.isDown('LEFT') || input.isDown('RIGHT'))
         && (powerupCode == 2) && (quadfire == 1) && !isGameOver && 
         (Date.now() - lastAllFire > bulletDelay)) {
          var x = player.pos[0] + player.sprite.size[0] / 2;
          var y = player.pos[1] + player.sprite.size[1] / 2;

          bullets.push({ pos: [x + player.sprite.size[0] / 2, y],
                         dir: 'right',
                         sprite: new Sprite('images/sprites.png', [0, 40], [bulletWidth, bulletHeight]) });

          bullets.push({ pos: [x - player.sprite.size[0] / 2, y],
                         dir: 'left',
                         sprite: new Sprite('images/sprites.png', [0, 40], [bulletWidth, bulletHeight]) });

          bullets.push({ pos: [x, y + player.sprite.size[1] / 2],
                         dir: 'up',
                         sprite: new Sprite('images/sprites.png', [0, 40], [bulletWidth, bulletHeight]) });

          bullets.push({ pos: [x, y - player.sprite.size[1] / 2],
                         dir: 'down',
                         sprite: new Sprite('images/sprites.png', [0, 40], [bulletWidth, bulletHeight]) });

          lastAllFire = Date.now();
      }

      //space nuke :D
      if(input.isDown('SPACE') && !isGameOver && !spaceNukeUsed && powerupCode == 1) {
        for(var z=0; z < enemies.length; z++) {
          enemies.splice(z, 1);
          z--;
          if (enemies.isLarge) score += 50;
          else score += 100;
        }
        spaceNukeUsed = 1;
        powerup = "None";
        info = "";
      }
    }

    //pause key

    if(input.isDown('ESC') && !isGameOver) {
      document.getElementById('pause').style.display="block";
      document.getElementById('pause-overlay').style.display="block";
      paused = 1;
      document.getElementById('unpause').addEventListener('click', function() {
        document.getElementById('pause').style.display="none";
        document.getElementById('pause-overlay').style.display="none";
        paused = 0;
      });
    }

    //q key
    document.addEventListener('keydown', function (evt) {
      if(evt.keyCode == 81) {
        if (hudToggle) {
          hudToggle = 0;
          timeAliveTagEl.innerHTML = "";
          timeAliveEl.innerHTML = "";
          livesTagEl.innerHTML = "";
          livesEl.innerHTML = "";
          powerupTagEl.innerHTML = "";
          powerupEl.innerHTML = "";
          infoEl.innerHTML = "";
          waveTag.innerHTML = "";
          wave.innerHTML = "";
          scoreTagEl.innerHTML = "";
          scoreEl.innerHTML = "";
        }
        else hudToggle = 1;
      }
    });
  }

function updateEntities(dt) {
    //console.log("number of powerups: ", powerups.length);
    //console.log("type of powerups: ", powerups.powerupCode);
    //console.log("position of powerups: ", powerups.pos);
    //console.log("bullets: ", bullets)

    //update playermodel (ship rotates with the players movement)
    if (playerMovementDirection == 0) {
      player.sprite.pos = [0,0]
    }
    else if (playerMovementDirection == 90) {
      player.sprite.pos = [39,0]
    }
    else if (playerMovementDirection == 180) {
      player.sprite.pos = [78,0]
    }
    else if (playerMovementDirection == 270) {
      player.sprite.pos = [117,0]
    }

    // Update all the bullets
    for(var i=0; i<bullets.length; i++) {
        var bullet = bullets[i];

        if (bullet.dir == 'up') bullet.pos[1] -= bulletSpeed * dt;
        if (bullet.dir == 'down') bullet.pos[1] += bulletSpeed * dt;
        if (bullet.dir == 'left') bullet.pos[0] -= bulletSpeed * dt;
        if (bullet.dir == 'right') bullet.pos[0] += bulletSpeed * dt;

        // Remove the bullet if it goes offscreen
        if(bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
           bullet.pos[0] > canvas.width || bullet.pos[0] < 0) {
            bullets.splice(i, 1);
            i--;
        }
    }

    //update powerup sprites
    for(var i=0; i<powerups.length; i++) {
      powerups[i].pos[0] = powerups[i].pos[0];
      powerups[i].pos[1] = powerups[i].pos[1];
    }

    // Update all the enemies
    for(var i=0; i<enemies.length; i++) {
      if (enemies[i].isLarge) {
        if(enemies[i].dir == 0){
          enemies[i].pos[1] -= enemySpeed * dt;
        }
        if(enemies[i].dir == 45){
          enemies[i].pos[0] += enemySpeed * dt;
          enemies[i].pos[1] -= enemySpeed * dt;
        }
        if(enemies[i].dir == 90){
          enemies[i].pos[0] += enemySpeed * dt;
        }
        if(enemies[i].dir == 135){
          enemies[i].pos[0] += enemySpeed * dt;
          enemies[i].pos[1] += enemySpeed * dt;
        }
        if(enemies[i].dir == 180){
          enemies[i].pos[1] += enemySpeed * dt;
        }
        if(enemies[i].dir == 225){
          enemies[i].pos[0] -= enemySpeed * dt;
          enemies[i].pos[1] += enemySpeed * dt;
        }
        if(enemies[i].dir == 270){
          enemies[i].pos[0] -= enemySpeed * dt;
        }
        if(enemies[i].dir == 315){
          enemies[i].pos[0] -= enemySpeed * dt;
          enemies[i].pos[1] -= enemySpeed * dt;
        }
      }

      else if(!enemies[i].isLarge) {
        if(enemies[i].dir == 0){
          enemies[i].pos[1] -= smallEnemySpeed * dt;
        }
        if(enemies[i].dir == 45){
          enemies[i].pos[0] += smallEnemySpeed * dt;
          enemies[i].pos[1] -= smallEnemySpeed * dt;
        }
        if(enemies[i].dir == 90){
          enemies[i].pos[0] += smallEnemySpeed * dt;
        }
        if(enemies[i].dir == 135){
          enemies[i].pos[0] += smallEnemySpeed * dt;
          enemies[i].pos[1] += smallEnemySpeed * dt;
        }
        if(enemies[i].dir == 180){
          enemies[i].pos[1] += smallEnemySpeed * dt;
        }
        if(enemies[i].dir == 225){
          enemies[i].pos[0] -= smallEnemySpeed * dt;
          enemies[i].pos[1] += smallEnemySpeed * dt;
        }
        if(enemies[i].dir == 270){
          enemies[i].pos[0] -= smallEnemySpeed * dt;
        }
        if(enemies[i].dir == 315){
          enemies[i].pos[0] -= smallEnemySpeed * dt;
          enemies[i].pos[1] -= smallEnemySpeed * dt;
        }
      }

        //Allow enemy to come in again from the other side of the screen
        // (i.e. if enemy goes off the left side of the screen it will appear in the same y axis coordinate on the right side)
        if(enemies[i].pos[0] + enemies[i].sprite.size[0] < 0) { //goes off the left side of the screen
          enemies[i].pos[0] = canvas.width;
        }
        else if(enemies[i].pos[0] > canvas.width) { //goes off the right side of the screen
          enemies[i].pos[0] = 0 - enemies[i].sprite.size[0];
        }
        else if(enemies[i].pos[1] + enemies[i].sprite.size[1] < 0) { //goes off the top side of the screen
          enemies[i].pos[1] = canvas.height;
        }
        else if(enemies[i].pos[1] > canvas.height) { //goes off the bottom side of the screen
          enemies[i].pos[1] = 0 - enemies[i].sprite.size[1];
        }
    }
}

// Collisions

function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

var invincible = 0;
var startTime;
var endTime;

var powerupCode = 0;
var spaceNukeUsed = 0;
var quadfire = 0;

function checkCollisions() {
    checkPlayerBounds();
    
    // Run collision detection for all enemies and bullets
    for(var i=0; i<enemies.length; i++) {
        var pos = enemies[i].pos;
        var size = enemies[i].sprite.size;

        for(var j=0; j<bullets.length; j++) {
            var pos2 = bullets[j].pos;
            var size2 = bullets[j].sprite.size;

              if(boxCollides(pos, size, pos2, size2)) {

                if(enemies[i].isLarge) {
                  //enemy breaks apart into two enemies

                  var dir = Math.random() * 360;
                  if (dir >= 0 && dir < 45) dir = 0;
                  if (dir >= 45 && dir < 90) dir = 45;
                  if (dir >= 90 && dir < 135) dir = 90;
                  if (dir >= 135 && dir < 180) dir = 135;
                  if (dir >= 180 && dir < 225) dir = 180;
                  if (dir >= 225 && dir < 270) dir = 225;
                  if (dir >= 270 && dir < 315) dir = 270;
                  if (dir >= 315 && dir < 360) dir = 315;
                  if (dir == 360) dir = 0;

                  var lastKnownPos = enemies[i].pos;
                  enemies.splice(i, 1);
                  i--;
                  score += 50; //large asteroids = 50 pts
                  enemies.push({
                      pos: [lastKnownPos[0] + 5 , lastKnownPos[1] - 10],
                      dir: dir,
                      isLarge: false,
                      sprite: new Sprite('images/sprites.png', [0, 73], [smallEnemyWidth, smallEnemyHeight])
                  });
                  if (dir + 180 > 360) dir -= 180;
                  else dir += 180;
                  enemies.push({
                      pos: [lastKnownPos[0] - 5 , lastKnownPos[1] + 10],
                      dir: dir,
                      isLarge: false,
                      sprite: new Sprite('images/sprites.png', [0, 73], [smallEnemyWidth, smallEnemyHeight])
                  });
                }

                else if(!enemies[i].isLarge) {
                  // Remove the enemy
                  score += 100; //small asteroids = 100 pts
                  enemies.splice(i, 1);
                  i--;
                }

                  //theres a 1 in 50 chance of getting a powerup drop from an enemy
                  var lotteryDropEnemy = Math.random() * 50;
                  if (lotteryDropEnemy > 36 && lotteryDropEnemy <= 37) { //arbitrary

                    powerups.push({
                      pos: pos2,
                      sprite: new Sprite('images/sprites.png', [15, 39], [powerupWidth, powerupHeight])
                    })
                  }

                  // Remove the bullet and stop this iteration
                  bullets.splice(j, 1);
                  break;
              }
        }

        if(boxCollides(pos, size, player.pos, player.sprite.size)) {
          if (!invincible){ //player is invincible (passes through enemies) for three seconds after a death
            if (lives > 1) {
              player.pos = [canvas.width/2, canvas.height/2];
                startTime = Date.now();
                endTime = Date.now() + 3000;
                invincible = 1;
                quadfire = 0;
              lives--;
            }
            else {
              lives--;
              gameOver();
            }
          }
          else if (Date.now() > endTime) {
            invincible = 0;
            if (powerup == "Invincibility!") {
              powerup = "None";
              info = "";
            }
          }
        }

        for(var k=0; k<powerups.length; k++) {
              var pos3 = powerups[k].pos;
              var size3 = powerups[k].sprite.size;

              if(boxCollides(player.pos, player.sprite.size, pos3, size3)) {
                score += 5;
                console.log(powerupCode);
                quadfire = 0;

                  var whatPowerup = Math.random();
                    if(whatPowerup <= 0.050) { //there is a .05 probability of a space nuke
                      //space nuke = clear all enemies off screen when spacebar is hit (one time use)
                      powerupCode = 1;
                    }
                    if(whatPowerup > 0.050 && whatPowerup <= 0.150) {//there is a .1 probability of a quad shot
                      //quad shot = shoot four ways with any button press
                      powerupCode = 2;
                    }
                    if(whatPowerup > 0.150 && whatPowerup <= 0.350) {//there is a .2 probability of a rapid fire
                      //rapid fire = shot speed doubles
                      powerupCode = 3;
                    }
                    if(whatPowerup > 0.350 && whatPowerup <= 0.525) {//there is a .175 probability of a slow fire
                      //slow fire = shot speed halves
                      powerupCode = 4;
                    }
                    if(whatPowerup > 0.525 && whatPowerup <= 0.725) {//there is a .2 probability of a ship speed up
                      //rapid move = ship speed doubles
                      powerupCode = 5;
                    }
                    if(whatPowerup > 0.725 && whatPowerup <= 0.900) {//there is a .175 probability of a ship slow down
                      //slow move = ship speed halves
                      powerupCode = 6;
                    }
                    if(whatPowerup > 0.900 && whatPowerup <= 0.925) {//there is a .025 probability of 30 second invincibility
                      //30s invincibility = destroy any enemy the ship runs into
                      powerupCode = 7;
                    }
                    if(whatPowerup > 0.925 && whatPowerup <= 0.975) {//there is a .05 probability of an extra life
                      //extra life = life++
                      powerupCode = 8;
                    }
                    if(whatPowerup > 0.975 && whatPowerup <= 1.000) {//there is a .025 probability of multiplying your score by 2
                      //scorebonus = score *= 2
                      powerupCode = 9;
                    }

                switch(powerupCode) {
                  case 1: //spacenuke
                    spaceNukeUsed = 0; 
                    powerup = "Space Nuke!";
                    info = "Press SPACE to clear all enemies.";break;
                  case 2: //quadshot
                    quadfire = 1; 
                    powerup = "Quadshot";
                    info = "Ship fires all four directions no matter what button you press.";break;
                  case 3: //rapidfire
                    bulletDelay = 50; 
                    powerup = "Rapidfire";
                    info = "Ship fires bullets faster.";break;
                  case 4: //slowfire
                    bulletDelay = 200;
                    powerup = "Slowfire";
                    info = "Ship fires bullets slower.";break;
                  case 5: //rapidmove
                    playerSpeed = 400;
                    powerup = "Speed Boost";
                    info = "Ship moves faster.";break;
                  case 6: //slowmove
                    playerSpeed = 100;
                    powerup = "Speed Reduce";
                    info = "Ship moves slower.";break;
                  case 7: //30invincible
                    startTime = Date.now();
                    endTime = Date.now() + 30000;
                    invincible = 1; 
                    powerup = "Invincibility!";
                    info = "You are invincible for 30 seconds!"
                    break;
                  case 8: //xtralife
                    lives++; 
                    powerup = "Extra Life";
                    info = "You have one extra life.";break;
                  case 9: //2score
                    score *= 2; 
                    score = Math.ceil(score); 
                    powerup = "Score Multiplier";
                    info = "Your score has been increased by 200%.";break;
                  default: score++;
                }
                powerups.splice(k, 1);
                k--;
              }
        }
    }
}

function checkPlayerBounds() {
    // Check bounds
    if(player.pos[0] < 0) {
        player.pos[0] = 0;
    }
    else if(player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }

    if(player.pos[1] < 0) {
        player.pos[1] = 0;
    }
    else if(player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - player.sprite.size[1];
    }
}

// Draw everything
function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player);
    }

    renderEntities(bullets);
    renderEntities(enemies);
    renderEntities(powerups);
    //renderEntities(explosions);
};

function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        renderEntity(list[i]);
    }    
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}

// Game over
function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';

    //document.getElementById('hud').style.display = 'none';
    //document.getElementById('hud-overlay').style.display = 'none';
    isGameOver = true;
    paused = 1;
    lives = 0;
    timeAlive = timeAlive;

//SQL STUFF GOES HERE :D

}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';

    //document.getElementById('hud').style.display = 'block';
    //document.getElementById('hud-overlay').style.display = 'block';
    isGameOver = false;
    paused = 0;
    gameTime = 0;
    timeAlive = 0;
    powerupCode = 0;
    score = 0;
    lives = 3;
    powerup = "None";
    info = "";
    playerSpeed = 200;
    bulletDelay = 100;
    quadfire = 0;
    spaceNukeUsed = 0;
    enemySpeed = 40;
    smallEnemySpeed = 65;
    maxEnemyCountReached = 1;
    enemyMaxWave = 10;
    timeBetweenWaves = 20000; //20s
    waveStart = Date.now(); 
    waveScoreBonus = 0;
    wave = 0;
    enemies = [];
    bullets = [];
    powerups = [];

    player.pos = [canvas.width / 2, canvas.height / 2];
};