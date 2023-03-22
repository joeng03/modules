/* [Imports] */
import { context } from 'js-slang/moduleHelpers';
import { Core } from './core.js';
import { CsgModuleState } from './utilities.js';

/* [Main] */
let moduleState = new CsgModuleState();

context.moduleContexts.csg.state = moduleState;
// We initialise Core for the first time over on the bundles' end here
Core.initialize(moduleState);

/* [Exports] */
export {
  area,
  black,
  blue,
  cone,
  crimson,
  cube,
  cyan,
  cylinder,
  geodesic_sphere,
  gray,
  green,
  group,
  intersect,
  is_shape,
  lime,
  navy,
  orange,
  pink,
  prism,
  purple,
  pyramid,
  render,
  render_axis,
  render_grid,
  render_grid_axis,
  rose,
  rotate,
  rounded_cube,
  rounded_cylinder,
  scale,
  shape_center,
  shape_set_center,
  silver,
  sphere,
  star,
  store,
  subtract,
  teal,
  torus,
  translate,
  union,
  volume,
  white,
  yellow,
} from './functions';
