import {
  getGPUTier
} from "detect-gpu";

const tier = getGPUTier({
  mobileBenchmarkPercentages: [10, 40, 30, 20], // (Default) [TIER_0, TIER_1, TIER_2, TIER_3]
  desktopBenchmarkPercentages: [10, 40, 30, 20], // (Default) [TIER_0, TIER_1, TIER_2, TIER_3]
  // forceRendererString: 'Apple A11 GPU', // (Development) Force a certain renderer string
  // forceMobile: true, // (Development) Force the use of mobile benchmarking scores
});

const dpr = Math.min(1.5, window.devicePixelRatio || 1);

const url = new URLSearchParams(window.location.search)
const settings = {
  count: url.get('count') || 64,
  shadowmap: url.get('shadow') || 1024,
  tier,
  dpr,
  fxaa: true,
};

settings.count = parseInt(settings.count)
settings.shadowmap = parseInt(settings.shadowmap)

console.log(`⚙️ settings`, settings);

export default settings;