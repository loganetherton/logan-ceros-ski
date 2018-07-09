class Skier {
  constructor() {
    this.assets       = {
      'skierCrash'    : 'img/skier_crash.png',
      'skierLeft'     : 'img/skier_left.png',
      'skierLeftDown' : 'img/skier_left_down.png',
      'skierDown'     : 'img/skier_down.png',
      'skierRightDown': 'img/skier_right_down.png',
      'skierRight'    : 'img/skier_right.png',
      'tree'          : 'img/tree_1.png',
      'treeCluster'   : 'img/tree_cluster.png',
      'rock1'         : 'img/rock_1.png',
      'rock2'         : 'img/rock_2.png'
    };
    // Record key values rather than use magic numbers
    this.keyValues = {
      left: 37,
      right: 39,
      down: 40,
      up: 38
    };
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
    // Cache for application assets?
    this.loadedAssets = {};

    // Available obstacles
    this.obstacleTypes = ['tree', 'treeCluster', 'rock1', 'rock2'];

    this.obstacles = [];

    this.gameWidth  = window.innerWidth;
    this.gameHeight = window.innerHeight;

    // Ensure mobile handling
    this.pixelRatio = window.devicePixelRatio;

    // Ratio for calculating skier movement
    this.skierMovementRatio = 1.4142;

    // Object placement standard to ensure that the screen doesn't fill up with objects
    this.objectPlaceConstant = 8;

    // Buffer to ensure objects aren't placed at the very edge
    this.objectPlacementBuffer = 50;

    // Initial skier speed
    this.initialSpeed = 8;

    // Initial load object multipliers
    this.initialLoadObjectMultipliers = {
      low: 5,
      high: 7
    };

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

    // Handle movement
    this.moveSkier();

    // Handle crash
    this.checkIfSkierHitObstacle();

    // Place assets
    this.drawSkier();
    this.drawObstacles();

    // Draw
    this.ctx.restore();
    requestAnimationFrame(this.boundGameLoop);
  };

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
    switch (this.skierDirection) {
      case this.skierDirectionValues.downLeft:
        this.skierMapX -= Math.round(this.skierSpeed / this.skierMovementRatio);
        this.skierMapY += Math.round(this.skierSpeed / this.skierMovementRatio);

        this.placeNewObstacle(this.skierDirection);
        break;
      case this.skierDirectionValues.down:
        this.skierMapY += this.skierSpeed;

        this.placeNewObstacle(this.skierDirection);
        break;
      case this.skierDirectionValues.downRight:
        this.skierMapX += this.skierSpeed / this.skierMovementRatio;
        this.skierMapY += this.skierSpeed / this.skierMovementRatio;

        this.placeNewObstacle(this.skierDirection);
        break;
    }
  };

  /**
   * Return the image to use for the skier based on direction
   * @returns {int}
   */
  getSkierImageByDirection() {
    let skierAssetName;
    switch (this.skierDirection) {
      case this.skierDirectionValues.crashed:
        skierAssetName = 'skierCrash';
        break;
      case this.skierDirectionValues.left:
        skierAssetName = 'skierLeft';
        break;
      case this.skierDirectionValues.downLeft:
        skierAssetName = 'skierLeftDown';
        break;
      case this.skierDirectionValues.down:
        skierAssetName = 'skierDown';
        break;
      case this.skierDirectionValues.downRight:
        skierAssetName = 'skierRightDown';
        break;
      case this.skierDirectionValues.right:
        skierAssetName = 'skierRight';
        break;
    }

    return skierAssetName;
  };

  /**
   * Paint the current skier image based on direction
   */
  drawSkier() {
    // Determine asset based on direction
    const skierAssetName = this.getSkierImageByDirection();
    const skierImage     = this.loadedAssets[skierAssetName];
    const x              = (this.gameWidth - skierImage.width) / 2;
    const y              = (this.gameHeight - skierImage.height) / 2;

    this.ctx.drawImage(skierImage, x, y, skierImage.width, skierImage.height);
  };

  /**
   * Paint obstacles
   */
  drawObstacles() {
    const newObstacles = [];

    this.obstacles.forEach(obstacle => {
      const obstacleImage = this.loadedAssets[obstacle.type];
      const x             = obstacle.x - this.skierMapX - obstacleImage.width / 2;
      const y             = obstacle.y - this.skierMapY - obstacleImage.height / 2;

      // Don't draw in invalid locations
      if (x < (this.objectPlacementBuffer * -2) ||
          x > this.gameWidth + this.objectPlacementBuffer ||
          y < (this.objectPlacementBuffer * -2)
          || y > this.gameHeight + this.objectPlacementBuffer) {
        return;
      }

      this.ctx.drawImage(obstacleImage, x, y, obstacleImage.width, obstacleImage.height);

      newObstacles.push(obstacle);
    });

    this.obstacles = newObstacles;
  };

  /**
   * Initialize the obstacles upon init
   */
  placeInitialObstacles() {
    // Just make the number of inital objects a simple ratio
    console.log(Math.ceil(this.gameWidth / this.gameHeight));
    const numberObstacles = Math.ceil(this.gameWidth / this.gameHeight) *
                            _.random(this.initialLoadObjectMultipliers.low, this.initialLoadObjectMultipliers.high);

    const minX = this.objectPlacementBuffer * -1;
    const maxX = this.gameWidth + this.objectPlacementBuffer;
    // Place objects beneath the player's position
    const minY = this.gameHeight / 2 + (this.objectPlaceConstant * 2);
    const maxY = this.gameHeight + this.objectPlacementBuffer;

    // Iterate and place objects
    for (let i = 0; i < numberObstacles; i++) {
      this.placeRandomObstacle(minX, maxX, minY, maxY);
    }

    // Sort obstacles by y value
    this.obstacles = this.obstacles.sort((current, prev) => {
      if (current.y === prev.y) {
        return 0;
      }
      return current.y > prev.y ? 1 : -1;
    });
  };

  /**
   * Place an obstacle, ensuring not to overlap with any other obstacles
   * @param direction Skier direction
   */
  placeNewObstacle(direction) {
    const shouldPlaceObstacle = Skier.getRandomNumber(this.objectPlaceConstant);
    // Only continue if we randomly generate an eight
    if (shouldPlaceObstacle !== this.objectPlaceConstant) {
      return;
    }

    const leftEdge   = this.skierMapX;
    const rightEdge  = this.skierMapX + this.gameWidth;
    const topEdge    = this.skierMapY;
    const bottomEdge = this.skierMapY + this.gameHeight;

    switch (direction) {
      case this.skierDirectionValues.left:
        this.placeRandomObstacle(leftEdge - this.objectPlacementBuffer, leftEdge, topEdge, bottomEdge);
        break;
      case this.skierDirectionValues.downLeft:
        this.placeRandomObstacle(leftEdge - this.objectPlacementBuffer, leftEdge, topEdge, bottomEdge);
        this.placeRandomObstacle(leftEdge, rightEdge, bottomEdge, bottomEdge + this.objectPlacementBuffer);
        break;
      case this.skierDirectionValues.down:
        this.placeRandomObstacle(leftEdge, rightEdge, bottomEdge, bottomEdge + this.objectPlacementBuffer);
        break;
      case this.skierDirectionValues.downRight:
        this.placeRandomObstacle(rightEdge, rightEdge + this.objectPlacementBuffer, topEdge, bottomEdge);
        this.placeRandomObstacle(leftEdge, rightEdge, bottomEdge, bottomEdge + this.objectPlacementBuffer);
        break;
      case this.skierDirectionValues.right:
        this.placeRandomObstacle(rightEdge, rightEdge + this.objectPlacementBuffer, topEdge, bottomEdge);
        break;
      case this.skierDirectionValues.up:
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
    const obstacleIndex = Skier.getRandomNumber(this.obstacleTypes.length - 1);

    // Find an open position
    const position = this.calculateOpenPosition(minX, maxX, minY, maxY);

    this.obstacles.push({
      type: this.obstacleTypes[obstacleIndex],
      x   : position.x,
      y   : position.y
    })
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

      // Check for collision with current objects
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
    const skierAssetName = this.getSkierImageByDirection();
    const skierImage     = this.loadedAssets[skierAssetName];
    // Draw rectangle to keep skier in the middle
    const skierRect      = {
      left  : this.skierMapX + this.gameWidth / 2,
      right : this.skierMapX + skierImage.width + this.gameWidth / 2,
      top   : this.skierMapY + skierImage.height - 5 + this.gameHeight / 2,
      bottom: this.skierMapY + skierImage.height + this.gameHeight / 2
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
      return this.skierObstacleOverlap(skierRect, obstacleRect);
    });

    if (collision.length) {
      this.skierDirection = 0;
    }
  };

  /**
   * Determine if skier and object are overlapping coordinates
   * @param skier
   * @param obstacle
   * @returns {boolean}
   */
  skierObstacleOverlap(skier, obstacle) {
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
    return this.skierDirection === this.skierDirectionValues.crashed;
  }

  /**
   * Handle direction arrow keypress
   */
  setupKeyhandler() {
    $(window).keydown(event => {
      switch (event.which) {
        // Move left based on current direction. If crashed, set in down-left position
        case this.keyValues.left:
          if (this.skierDirection === this.skierDirectionValues.left) {
            this.skierMapX -= this.skierSpeed;
            this.placeNewObstacle(this.skierDirection);
          } else if (this.skierCrashedState()) {
            this.skierDirection = this.skierDirectionValues.downLeft;
          } else {
            this.skierDirection--;
          }
          event.preventDefault();
          break;
        // Move right based on current direction. If crashed, set in down-right position
        case this.keyValues.right:
          if (this.skierDirection === this.skierDirectionValues.right) {
            this.skierMapX += this.skierSpeed;
            this.placeNewObstacle(this.skierDirection);
          } else if (this.skierCrashedState()) {
            this.skierDirection = this.skierDirectionValues.downRight;
          } else {
            this.skierDirection++;
          }
          event.preventDefault();
          break;
        // Move up if skier is going either complete left or right
        case this.keyValues.up:
          if (this.skierDirection === this.skierDirectionValues.left ||
              this.skierDirection === this.skierDirectionValues.right) {
            this.skierMapY -= this.skierSpeed;
            this.placeNewObstacle(this.skierDirectionValues.up);
          }
          event.preventDefault();
          break;
        case this.keyValues.down:
          this.skierDirection = 3;
          event.preventDefault();
          break;
      }
    });
  };

  /**
   * Handle the initial drawing, set initial values for speed, direction, etc
   */
  initialDraw() {
    // skier movement and direction values
    this.skierDirection = this.skierDirectionValues.right;
    this.skierMapX      = 0;
    this.skierMapY      = 0;
    this.skierSpeed     = this.initialSpeed;

    // Create canvas and set full screen
    this.canvas = $('<canvas></canvas>')
    .attr('width', this.gameWidth * this.pixelRatio)
    .attr('height', this.gameHeight * this.pixelRatio)
    .css({
      width : this.gameWidth + 'px',
      height: this.gameHeight + 'px'
    });
    // Attach canvas
    $('body').append(this.canvas);
  }
}

$(() => {
  const skier = new Skier();
  skier.initGame();
});
