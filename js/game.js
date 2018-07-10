class Game {
  constructor() {
    /**
     * Assets and display
     */
    this.assetNames = {
      SKIERCRASH    : 'skierCrash',
      SKIERLEFT     : 'skierLeft',
      SKIERLEFTDOWN : 'skierLeftDown',
      SKIERDOWN     : 'skierDown',
      SKIERRIGHTDOWN: 'skierRightDown',
      SKIERRIGHT    : 'skierRight',
      TREE          : 'tree',
      TREECLUSTER   : 'treeCluster',
      ROCK1         : 'rock1',
      ROCK2         : 'rock2',
      JUMPRAMP      : 'jumpRamp',
      SKIERJUMP1    : 'skierJump1',
      SKIERJUMP2    : 'skierJump2',
      SKIERJUMP3    : 'skierJump3',
      SKIERJUMP4    : 'skierJump4',
      SKIERJUMP5    : 'skierJump5',
    };
    // Asset images
    this.assets = {
      [this.assetNames.SKIERCRASH]    : 'img/skier_crash.png',
      [this.assetNames.SKIERLEFT]     : 'img/skier_left.png',
      [this.assetNames.SKIERLEFTDOWN] : 'img/skier_left_down.png',
      [this.assetNames.SKIERDOWN]     : 'img/skier_down.png',
      [this.assetNames.SKIERRIGHTDOWN]: 'img/skier_right_down.png',
      [this.assetNames.SKIERRIGHT]    : 'img/skier_right.png',
      [this.assetNames.TREE]          : 'img/tree_1.png',
      [this.assetNames.TREECLUSTER]   : 'img/tree_cluster.png',
      [this.assetNames.ROCK1]         : 'img/rock_1.png',
      [this.assetNames.ROCK2]         : 'img/rock_2.png',
      [this.assetNames.JUMPRAMP]      : 'img/jump_ramp.png',
      [this.assetNames.SKIERJUMP1]    : 'img/skier_jump_1.png',
      [this.assetNames.SKIERJUMP2]    : 'img/skier_jump_2.png',
      [this.assetNames.SKIERJUMP3]    : 'img/skier_jump_3.png',
      [this.assetNames.SKIERJUMP4]    : 'img/skier_jump_4.png',
      [this.assetNames.SKIERJUMP5]    : 'img/skier_jump_5.png',
    };

    // Cache for application assets?
    this.loadedAssets = {};

    // Available obstacles
    this.obstacleTypes =
    [this.assetNames.TREE, this.assetNames.TREECLUSTER, this.assetNames.ROCK1, this.assetNames.ROCK2,
     this.assetNames.JUMPRAMP];

    this.obstacles = [];

    // Initial load object multipliers
    this.initialLoadObjectMultipliers = {
      low: 5,
      high: 7
    };

    // Object placement standard to ensure that the screen doesn't fill up with objects
    this.objectPlacementConstant = 8;

    // Buffer to ensure objects aren't placed at the very edge
    this.objectPlacementBuffer = 50;

    // Key values for directional keys
    this.keyValues = {
      left: 37,
      right: 39,
      down: 40,
      up: 38
    };

    this.gameWidth  = window.innerWidth;
    this.gameHeight = window.innerHeight;

    // Ensure mobile handling
    this.pixelRatio = window.devicePixelRatio;

    // Display for points
    const pointsCounterWidthRatio  = 2;
    const pointsCounterHeightRatio = 7;
    this.pointsCounterWidth = this.gameWidth / pointsCounterWidthRatio;
    this.pointsCounterHeight = this.gameHeight / pointsCounterHeightRatio;
    this.pointsCounter = $('.points');

    // Display for reset button
    const resetWidthRatio = 13;
    const resetHeightRatio = 20;
    const resetMarginRatio = 100;
    this.resetButtonWidth = this.gameWidth / resetWidthRatio;
    this.resetButtonHeight = this.gameHeight / resetHeightRatio;
    this.resetButtonMarginLeft = this.gameWidth / resetMarginRatio;
    this.resetButton = $('#reset');

    /**
     * Skier
     */
    // Skier object instance
    this.skier = null;

    // Bind gameloop method once since it's an expensive call
    this.boundGameLoop = this.gameLoop.bind(this);
  }

  /**
   * Initiate the game and set the ball rolling!
   */
  initGame() {
    this.initialDraw();
    this.ctx = this.canvas[0].getContext('2d');

    this.setupKeyhandler();
    // After loading assets, display them and begin animation
    Promise.all(this.loadAssets()).then(() => {
      this.placeInitialObstacles();

      requestAnimationFrame(this.boundGameLoop);
    });
  };

  /**
   * Run the loop repeatedly for animation display and events
   */
  gameLoop() {
    this.ctx.save();

    // Retina support
    this.ctx.scale(this.pixelRatio, this.pixelRatio);

    // Remove content to draw the next frame
    this.clearCanvas();

    if (this.skier) {
      // Handle movement
      this.moveSkier();

      // Handle crash
      this.checkIfSkierHitObstacle();
    }

    // Place assets
    this.drawSkier();
    this.drawObstacles();

    // Draw
    this.ctx.restore();
    requestAnimationFrame(this.boundGameLoop);

    // Update points counter
    this.updatePointsCounter();
  };

  /**
   * Update the points counter to show the current points
   */
  updatePointsCounter() {
    this.pointsCounter.find('#current-points').html('Points: ' + this.skier.points);
    this.pointsCounter.find('#high-score').html('High Score: ' + this.skier.highScore);
    this.pointsCounter.find('#all-time').html('All Time High Score: ' + this.skier.allTimeHighScore);
  }

  /**
   * Remove previous image from canvas to prepare for drawing of new image
   */
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
  };

  /**
   * Handle skier movement via keyboard
   */
  moveSkier() {
    let awardPoints = false;
    switch (this.skier.skierDirection) {
      case this.skier.skierDirectionValues.downLeft:
        this.skier.skierMapX -= Math.round(this.skier.skierSpeed / this.skier.skierMovementRatio);
        this.skier.skierMapY += Math.round(this.skier.skierSpeed / this.skier.skierMovementRatio);

        this.placeNewObstacle(this.skier.skierDirection);
        awardPoints = true;
        break;
      case this.skier.skierDirectionValues.down:
        this.skier.skierMapY += this.skier.skierSpeed;

        this.placeNewObstacle(this.skier.skierDirection);
        awardPoints = true;
        break;
      case this.skier.skierDirectionValues.downRight:
        this.skier.skierMapX += this.skier.skierSpeed / this.skier.skierMovementRatio;
        this.skier.skierMapY += this.skier.skierSpeed / this.skier.skierMovementRatio;

        this.placeNewObstacle(this.skier.skierDirection);
        awardPoints = true;
        break;
    }

    // Award points if moving downhill
    if (this.skier && awardPoints) {
      this.skier.increasePoints();
    }
  };

  /**
   * Return the image to use for the skier based on direction
   * @returns {string}
   */
  getSkierImageByMovement() {
    let skierAssetName;
    // Skier not drawn
    if (!this.skier) {
      return this.assetNames.SKIERRIGHT;
    }
    // Jumping
    if (this.skier && this.skier.jumpImage) {
      // Set current jump image
      return this.assetNames.SKIERJUMP1.replace('1', this.skier.jumpImage)
    }
    // Normal movement
    switch (this.skier.skierDirection) {
      case this.skier.skierDirectionValues.crashed:
        skierAssetName = this.assetNames.SKIERCRASH;
        break;
      case this.skier.skierDirectionValues.left:
        skierAssetName = this.assetNames.SKIERLEFT;
        break;
      case this.skier.skierDirectionValues.downLeft:
        skierAssetName = this.assetNames.SKIERLEFTDOWN;
        break;
      case this.skier.skierDirectionValues.down:
        skierAssetName = this.assetNames.SKIERDOWN;
        break;
      case this.skier.skierDirectionValues.downRight:
        skierAssetName = this.assetNames.SKIERRIGHTDOWN;
        break;
      case this.skier.skierDirectionValues.right:
        skierAssetName = this.assetNames.SKIERRIGHT;
        break;
    }

    return skierAssetName;
  };

  /**
   * Paint the current skier image based on direction
   */
  drawSkier() {
    // Determine asset based on direction
    const skierAssetName = this.getSkierImageByMovement();

    const skierImage     = this.loadedAssets[skierAssetName];
    const x              = (this.gameWidth - skierImage.width) / 2;
    const y              = (this.gameHeight - skierImage.height) / 2;

    // Create or modify skier instance
    if (!this.skier) {
      this.skier = new Skier(x, y, skierAssetName);
    } else {
      this.skier.x = x;
      this.skier.y = y;
      this.skier.type = skierAssetName;
    }

    this.ctx.drawImage(skierImage, this.skier.x, this.skier.y, skierImage.width, skierImage.height);
  };

  /**
   * Factory for asset images
   * @param x X position
   * @param y Y position
   * @param type Asset type
   * @returns {AssetImage}
   */
  static createAssetImage(x, y, type) {
    return new AssetImage(x, y, type);
  }

  /**
   * Paint obstacles
   */
  drawObstacles() {
    // Filter obstacles which we no longer need
    this.obstacles = this.obstacles.filter(obstacle => {
      const obstacleImage = this.loadedAssets[obstacle.type];
      // Appearance of movement as skier moves. Obstacles stay where they are, and skier is the one moving.
      const x             = obstacle.x - this.skier.skierMapX - obstacleImage.width / 2;
      const y             = obstacle.y - this.skier.skierMapY - obstacleImage.height / 2;

      // Don't draw in invalid locations, remove obstacles as they're not longer needed
      if (x < (this.objectPlacementBuffer * -2) ||
          x > this.gameWidth + this.objectPlacementBuffer ||
          y < (this.objectPlacementBuffer * -2)
          || y > this.gameHeight + this.objectPlacementBuffer) {
        return false;
      }

      this.ctx.drawImage(obstacleImage, x, y, obstacleImage.width, obstacleImage.height);

      return true;
    });
  };

  /**
   * Initialize the obstacles upon init
   */
  placeInitialObstacles() {
    // Just make the number of inital objects a simple ratio
    const numberObstacles = Math.ceil(this.gameWidth / this.gameHeight) *
                            _.random(this.initialLoadObjectMultipliers.low, this.initialLoadObjectMultipliers.high);

    const minX = this.objectPlacementBuffer * -1;
    const maxX = this.gameWidth + this.objectPlacementBuffer;
    // Place objects beneath the player's position
    const minY = this.gameHeight / 2 + (this.objectPlacementConstant * 2);
    const maxY = this.gameHeight + this.objectPlacementBuffer;

    // Iterate and place objects
    for (let i = 0; i < numberObstacles; i++) {
      this.placeRandomObstacle(minX, maxX, minY, maxY);
    }

    // Sort obstacles by y value
    this.obstacles = this.sortObstaclesByY();
  };

  /**
   * Sort obstacles by their Y values
   * @returns {AssetImage[]}
   */
  sortObstaclesByY() {
    return this.obstacles.sort((current, prev) => {
      if (current.y === prev.y) {
        return 0;
      }
      return current.y > prev.y ? 1 : -1;
    });
  }

  /**
   * Place an obstacle, ensuring not to overlap with any other obstacles
   * @param direction Skier direction
   */
  placeNewObstacle(direction) {
    const shouldPlaceObstacle = Game.getRandomNumber(this.objectPlacementConstant);
    // Only continue if we randomly generate an eight
    if (shouldPlaceObstacle !== this.objectPlacementConstant) {
      return;
    }

    const leftEdge   = this.skier.skierMapX;
    const rightEdge  = this.skier.skierMapX + this.gameWidth;
    const topEdge    = this.skier.skierMapY;
    const bottomEdge = this.skier.skierMapY + this.gameHeight;

    switch (direction) {
      case this.skier.skierDirectionValues.left:
        this.placeRandomObstacle(leftEdge - this.objectPlacementBuffer, leftEdge, topEdge, bottomEdge);
        break;
      case this.skier.skierDirectionValues.downLeft:
        this.placeRandomObstacle(leftEdge - this.objectPlacementBuffer, leftEdge, topEdge, bottomEdge);
        this.placeRandomObstacle(leftEdge, rightEdge, bottomEdge, bottomEdge + this.objectPlacementBuffer);
        break;
      case this.skier.skierDirectionValues.down:
        this.placeRandomObstacle(leftEdge, rightEdge, bottomEdge, bottomEdge + this.objectPlacementBuffer);
        break;
      case this.skier.skierDirectionValues.downRight:
        this.placeRandomObstacle(rightEdge, rightEdge + this.objectPlacementBuffer, topEdge, bottomEdge);
        this.placeRandomObstacle(leftEdge, rightEdge, bottomEdge, bottomEdge + this.objectPlacementBuffer);
        break;
      case this.skier.skierDirectionValues.right:
        this.placeRandomObstacle(rightEdge, rightEdge + this.objectPlacementBuffer, topEdge, bottomEdge);
        break;
      case this.skier.skierDirectionValues.up:
        this.placeRandomObstacle(leftEdge, rightEdge, topEdge - this.objectPlacementBuffer, topEdge);
        break;
    }
  };

  /**
   * Just grab a random number between 0 and a specified value
   * @param maxNumber
   * @returns {number}
   */
  static getRandomNumber(maxNumber) {
    return Math.floor(Math.random() * maxNumber) + 1;
  }

  /**
   * Place an obstacle at random, making sure not to overlap any existing objects
   * @param minX Minimum x value
   * @param maxX Maximum x value
   * @param minY Minimum y value
   * @param maxY Maximum y value
   */
  placeRandomObstacle(minX, maxX, minY, maxY) {
    const obstacleIndex = Game.getRandomNumber(this.obstacleTypes.length - 1);

    // Find an open position
    const position = this.calculateOpenPosition(minX, maxX, minY, maxY);

    // Separate obstacles into another class for easy modification in the future
    this.obstacles.push(Game.createAssetImage(position.x, position.y, this.obstacleTypes[obstacleIndex]));
  };

  /**
   * Determine where there is an open space for placing an object
   * @param minX Minimum x value
   * @param maxX Maximum x value
   * @param minY Minimum y value
   * @param maxY Maximum y value
   * @returns {*}
   */
  calculateOpenPosition(minX, maxX, minY, maxY) {
    let potentialCollision = true;
    let x;
    let y;
    // Iterate until we're sure there's no collision
    while (potentialCollision) {
      x = _.random(minX, maxX);
      y = _.random(minY, maxY);

      // Check for collision with current objects, don't proceed if there is one
      const foundCollision = this.obstacles.filter(obstacle => {
        return x > (obstacle.x - this.objectPlacementBuffer) &&
               x < (obstacle.x + this.objectPlacementBuffer) &&
               y > (obstacle.y - this.objectPlacementBuffer) &&
               y < (obstacle.y + this.objectPlacementBuffer);
      });
      if (!foundCollision.length) {
        potentialCollision = false;
      }
    }

    return {
      x: x,
      y: y
    };
  };

  /**
   * If obstacle and skier image overlap, signify a crash and stop skier
   */
  checkIfSkierHitObstacle() {
    const skierAssetName = this.getSkierImageByMovement();
    const skierImage     = this.loadedAssets[skierAssetName];
    // Draw rectangle to keep skier in the middle
    const skierRect      = {
      left  : this.skier.skierMapX + this.gameWidth / 2,
      right : this.skier.skierMapX + skierImage.width + this.gameWidth / 2,
      top   : this.skier.skierMapY + skierImage.height - 5 + this.gameHeight / 2,
      bottom: this.skier.skierMapY + skierImage.height + this.gameHeight / 2
    };

    // Check to see if skier and obstacle dimensions overlap
    const collision = this.obstacles.filter(obstacle => {
      const obstacleImage = this.loadedAssets[obstacle.type];
      const obstacleRect  = {
        left  : obstacle.x,
        right : obstacle.x + obstacleImage.width,
        top   : obstacle.y + obstacleImage.height - 5,
        bottom: obstacle.y + obstacleImage.height
      };
      return Game.skierObstacleOverlap(skierRect, obstacleRect);
    });

    if (collision.length) {
       // Let's get that skier in  the air! Only jump when heading downhill
      if (collision[0].type === 'jumpRamp' && [this.skier.skierDirectionValues.downRight, this.skier.skierDirectionValues.down,
                                               this.skier.skierDirectionValues.downLeft].includes(this.skier.skierDirection)) {
        this.handleJump();
      // Crash skier, unless jumping
      } else if (!this.skier.isJumping) {
        this.skier.skierDirection = this.skier.skierDirectionValues.crashed;
        // Remove points, store what the previous total was
        this.skier.resetPoints();
      }
    }
  };

  /**
   * Skier jumps, set appropriate properties
   */
  handleJump() {
    this.skier.isJumping = true;
    this.skier.jumpImage = 1;
    // Handle jumping
    const jumpInterval = setInterval(() => {
      if (this.skier.jumpImage < 5) {
        this.skier.jumpImage++;
      } else {
        this.skier.isJumping = false;
        this.skier.jumpImage = null;
        clearInterval(jumpInterval);
      }
    }, this.skier.jumpInterval);
  }

  /**
   * Determine if skier and object are overlapping coordinates
   * @param skier
   * @param obstacle
   * @returns {boolean}
   */
  static skierObstacleOverlap(skier, obstacle) {
    return !(obstacle.left > skier.right ||
             obstacle.right < skier.left ||
             obstacle.top > skier.bottom ||
             obstacle.bottom < skier.top);
  };

  /**
   * Query and cache all necessary images
   * @returns {Promise[]}
   */
  loadAssets() {
    const assetPromises = [];

    // Iterate assets, create image, set src for each, return promise
    for (const assetName in this.assets) {
      if (this.assets.hasOwnProperty(assetName)) {
        const assetImage    = new Image();
        const assetDeferred = new Promise(resolve => {
          assetImage.onload = () => {
            assetImage.width /= 2;
            assetImage.height /= 2;

            this.loadedAssets[assetName] = assetImage;
            resolve();
          };
        });
        assetImage.src = this.assets[assetName];

        assetPromises.push(assetDeferred);
      }
    }

    return assetPromises;
  };

  /**
   * Convenience function to avoid writing out the identity each time
   * @returns {boolean}
   */
  skierCrashedState() {
    return this.skier.skierDirection === this.skier.skierDirectionValues.crashed;
  }

  /**
   * Handle direction arrow keypress
   */
  setupKeyhandler() {
    $(window).keydown(event => {
      switch (event.which) {
        // Move left based on current direction. If crashed, set in down-left position
        case this.keyValues.left:
          if (this.skier.skierDirection === this.skier.skierDirectionValues.left) {
            this.skier.skierMapX -= this.skier.skierSpeed;
            this.placeNewObstacle(this.skier.skierDirection);
          } else if (this.skierCrashedState()) {
            this.skier.skierDirection = this.skier.skierDirectionValues.downLeft;
          } else {
            this.skier.skierDirection--;
          }
          event.preventDefault();
          break;
        // Move right based on current direction. If crashed, set in down-right position
        case this.keyValues.right:
          if (this.skier.skierDirection === this.skier.skierDirectionValues.right) {
            this.skier.skierMapX += this.skier.skierSpeed;
            this.placeNewObstacle(this.skier.skierDirection);
          } else if (this.skierCrashedState()) {
            this.skier.skierDirection = this.skier.skierDirectionValues.downRight;
          } else {
            this.skier.skierDirection++;
          }
          event.preventDefault();
          break;
        // Move up if skier is going either complete left or right
        case this.keyValues.up:
          if (this.skier.skierDirection === this.skier.skierDirectionValues.left ||
              this.skier.skierDirection === this.skier.skierDirectionValues.right) {
            this.skier.skierMapY -= this.skier.skierSpeed;
            this.placeNewObstacle(this.skier.skierDirectionValues.up);
          }
          event.preventDefault();
          break;
        case this.keyValues.down:
          this.skier.skierDirection = this.skier.skierDirectionValues.down;
          event.preventDefault();
          break;
      }
    });
  };

  /**
   * Handle the initial drawing, set initial values for speed, direction, etc
   */
  initialDraw() {
    // // skier movement and direction values
    // this.skierDirection = this.skierDirectionValues.right;
    // this.skierMapX      = 0;
    // this.skierMapY      = 0;
    // this.skierSpeed     = this.initialSpeed;

    // Create canvas and set full screen
    this.canvas = $('<canvas></canvas>')
    .attr('width', this.gameWidth * this.pixelRatio)
    .attr('height', this.gameHeight * this.pixelRatio)
    .css({
      width : this.gameWidth + 'px',
      height: this.gameHeight + 'px'
    });

    // Display points counter
    this.pointsCounter
    .css({
      width : this.pointsCounterWidth + 'px',
      height: this.pointsCounterHeight + 'px',
      visibility: 'visible'
    });
    // Reset button
    this.resetButton
    .css({
      width: this.resetButtonWidth + 'px',
      height: this.resetButtonHeight + 'px',
      visibility: 'visible',
      'margin-left': this.resetButtonMarginLeft + 'px'
    });

    // Attach canvas
    $('body').append(this.canvas);
  }
}

$(() => {
  // Initiate the game
  const game = new Game();
  game.initGame();
});

/**
 * Set drawn images into a separate class for easy modification in the future with whatever we need
 */
class AssetImage {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
  }
}

class Skier extends AssetImage {
  constructor(x, y) {
    super();

    // Directional values for which way the skier is moving
    this.skierDirectionValues = {
      crashed: 0,
      left: 1,
      downLeft: 2,
      down: 3,
      downRight: 4,
      right: 5,
      up: 6
    };

    // Current skier direction
    this.skierDirection = this.skierDirectionValues.right;

    // Skier position
    this.skierMapX    = 0;
    this.skierMapY    = 0;
    // Skier speed
    this.initialSpeed = 8;
    this.skierSpeed   = this.initialSpeed;
    // Ratio for calculating skier movement
    this.skierMovementRatio = 1.4142;

    // Points
    this.points = 0;
    this.highScore = 0;
    this.allTimeHighScore = 0;

    // Keep track of movement so we can award points based on how far the skier has gone since last point
    this.movementBeforePoints = 0;

    // Skier is jumping
    this.isJumping = false;
    // Jump graphic to use
    this.jumpImage = null;
    // Interval between changing jump images
    this.jumpInterval = 250;

    // Retrieve all time high score from localStorage
    const allTimeHighScore = localStorage.getItem('allTimeHighScore');
    if (allTimeHighScore) {
      this.allTimeHighScore = allTimeHighScore;
    }
  }

  /**
   * Increase the number of points the player has. Award a point for every 3 movement spaces, or one space if jumping
   */
  increasePoints() {
    // Award a point every 3 spaces, or else every one space on a jump
    if (this.movementBeforePoints >= 3 || this.isJumping) {
      this.movementBeforePoints = 0;
      this.points = this.points + 1;

      // Store high score
      if (this.highScore < this.points) {
        this.highScore = this.points;
      }

      // Store all time high score both in instance and in localStorage
      if (this.allTimeHighScore < this.points) {
        this.allTimeHighScore = this.points;
        localStorage.setItem('allTimeHighScore', this.points);
      }
    // Increase movement to keep track of when to award points
    } else {
      this.movementBeforePoints++;
    }
  }

  /**
   * Reset points upon crash. Save the previous points for display
   */
  resetPoints() {
    this.points = 0;
  }
}
