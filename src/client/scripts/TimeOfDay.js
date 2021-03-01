const GAMMA = 1.0;

function generateLightBrightnessTable() {
    const table = Array(16);

    for (let i = 0; i <= 15; ++i) {
        const f1 = 1 - i / 15;
        table[i] = ((1 - f1) / (f1 * 3 + 1)) * 1 + 0;
    }

    return table;
}

function clamp(num, min, max) {
    return num > max ? max : Math.max(min, num);
}

function getCelestialAngle(time, dimension) {
    switch (dimension) {
        case "minecraft:the_nether":
        case "minecraft:nether":
            return 0.5;

        case "minecraft:the_end":
        case "minecraft:end":
            return 0;
    }

    const currTime = time % 24000;
    let f = clamp(currTime / 24e3 - 0.25, 0, 1);

    console.log(time, time % 24000, time / 24e3 - 0.25)
    const f1 = 1 - (Math.cos(f * Math.PI) + 1) / 2;
    f = f + (f1 - f) / 3;
    return f;
}

function calculateSkylight(worldTime, dimension) {
    const sunAngle = getCelestialAngle(worldTime, dimension);
    console.log(sunAngle);

    let subtracted = 1 - (Math.cos(sunAngle * (Math.PI * 2)) * 2 + 0.5);
    subtracted = clamp(subtracted, 0, 1);
    return 15 - subtracted * 11;
}

class TimeOfDay {
    constructor(game) {
        this.game = game;
        this.skyLightLevel = 15;
        this.lightmapColors = [];
        this.lightBrightnessTable = generateLightBrightnessTable();
    }

    update() {
        this.skyLightLevel = calculateSkylight(this.game.time, this.game.dimension);
        this.game.skyLight.intensity = this.lightBrightnessTable[this.skyLightLevel];
    }

    getSunBrightness() {
        const f = getCelestialAngle(time, this.game.dimension);

        let f1 = 1 - Math.cos(f * Math.PI * 2 * 2 + 0.2);
        f1 = 1 - clamp(f1, 0, 1);
        return f1 * 0.8 + 0.2;
    }

    /* updateLightmap() {
        let f = getSunBrightness(1);
        let f1 = f * 0.95 + 0.05;

        for (let i = 0; i < 256; ++i) {
            let f2 = this.table[i / 16] * f1;

            let f4 = f2 * (f * 0.65 + 0.35);
            let f5 = f2 * (f * 0.65 + 0.35);
            let f6 = f3 * ((f3 * 0.6 + 0.4) * 0.6 + 0.4);
            let f7 = f3 * (f3 * f3 * 0.6 + 0.4);
            let f8 = f4 + f3;
            let f9 = f5 + f6;
            let f10 = f2 + f7;
            f8 = f8 * 0.96 + 0.03;
            f9 = f9 * 0.96 + 0.03;
            f10 = f10 * 0.96 + 0.03;

            if (this.game.dimension === "minecraft:overworld") {
                f8 = 0.22 + f3 * 0.75;
                f9 = 0.28 + f6 * 0.75;
                f10 = 0.25 + f7 * 0.75;
            }

            /* if (this.mc.player.isPotionActive(MobEffects.NIGHT_VISION))
                          {
                              float f15 = this.getNightVisionBrightness(this.mc.player, partialTicks);
                              float f12 = 1.0F / f8;
      
                              if (f12 > 1.0F / f9)
                              {
                                  f12 = 1.0F / f9;
                              }
      
                              if (f12 > 1.0F / f10)
                              {
                                  f12 = 1.0F / f10;
                              }
      
                              f8 = f8 * (1.0F - f15) + f8 * f12 * f15;
                              f9 = f9 * (1.0F - f15) + f9 * f12 * f15;
                              f10 = f10 * (1.0F - f15) + f10 * f12 * f15;
                          } /

            if (f8 > 1) {
                f8 = 1;
            }

            if (f9 > 1) {
                f9 = 1;
            }

            if (f10 > 1) {
                f10 = 1;
            }

            let f17 = 1 - f8;
            let f13 = 1 - f9;
            let f14 = 1 - f10;
            f17 = 1 - f17 * f17 * f17 * f17;
            f13 = 1 - f13 * f13 * f13 * f13;
            f14 = 1 - f14 * f14 * f14 * f14;
            f8 = f8 * (1 - GAMMA) + f17 * GAMMA;
            f9 = f9 * (1 - GAMMA) + f13 * GAMMA;
            f10 = f10 * (1 - GAMMA) + f14 * GAMMA;
            f8 = clamp(f8 * 0.96 + 0.03, 0, 1);
            f9 = clamp(f9 * 0.96 + 0.03, 0, 1);
            f10 = clamp(f10 * 0.96 + 0.03, 0, 1);

            let k = f8 * 255;
            let l = f9 * 255;
            let i1 = f10 * 255;
            this.lightmapColors[i] = -16777216 | (k << 16) | (l << 8) | i1;
        }
    } */
}

export { TimeOfDay };