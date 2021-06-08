## Use cases

Hot-drop mimics the HTML5 drag API, but with a few important differences.
Only minimal data is used from the original DOM events, meaning it is a lot simpler to fire artificial events when you need to simulate a behaviour.
Additionally, by storing writable artifacts on the instance, you can easily "hot-swap" and modify any elements used in the drag operation, meaning you can easily modify the default behaviour.

## Quickstart

Simply import the javascript file in to your project, as well as the base.css styles that are required for functionality.
You can include the default.css to provide some premade visual styling, or you can add your own styles using that file as a reference for the classes to target.

## API

See the Typescript file for method definitions, and (after installing dev dependancies) run "npm run demo" to see some example setups in action, covering some interesting scenarios and demonstrating the principal methods (note that in a dynamic setup you may also want to use the corresponding teardown functions: deactivate, off, removeArtifacts).
