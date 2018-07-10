describe("Logan-Ceros-Skier", function () {

  function keyPress(which) {
    var press = $.Event("keydown");
    press.ctrlKey = false;
    press.which = which;
    $(window).trigger(press);
  }

  before(function () {
    return new Promise((resolve) => {
      const int = setInterval(() => {
        if (game.skier) {
          resolve();
          clearTimeout(int);
        }
      }, 1000);
    });
  });

  it('should start with 0 speed displayed', async function () {
    expect(game.skier.skierSpeedDisplay).to.be.equal(0);
  });

  it('should increase to 7 speed after moving', async function () {
    keyPress(40);
    expect(game.skier.skierSpeedDisplay).to.be.equal(7);
  });

  it('should increase points as you move', function (done) {
    setTimeout(() => {
      expect(game.skier.points).to.be.above(0);
      done();
    }, 1000);
  });

  it('should stop the skiier when he moves to the right', function (done) {
    let x = 0;
    let maxInts = 2;
    const interval = setInterval(() => {
      if (x > maxInts) {
        clearInterval(interval);
        expect(game.skier.skierSpeedDisplay).to.be.equal(0);
        done();
      } else {
        keyPress(39);
      }
      x++;
    }, 200);
  });

  it('should stop when you press the pause button', function (done) {
    setTimeout(() => {
      $('#pause').trigger('click');
      expect(game.gamePaused).to.be.equal(true);
      done();
    }, 500)
  });

  it('should resume you press the pause button again', function (done) {
    setTimeout(() => {
      $('#pause').trigger('click');
      expect(game.gamePaused).to.be.equal(false);
      done();
    }, 500)
  });

  it('should reset the game when the reset button is clicked', function (done) {
    $('#reset').trigger('click');
    setTimeout(() => {
      expect(game.skier.skierSpeedDisplay).to.be.equal(0);
      expect(game.skier.points).to.be.equal(0);
      done();
    }, 1000)
  });
});
