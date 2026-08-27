[](https://tympanus.net/codrops/)

* [All Posts](https://tympanus.net/codrops/all-posts/)
* [Creative Hub](https://tympanus.net/codrops/hub/)
* [Webzibition](https://tympanus.net/codrops/webzibition/)

By [Anderson Mancini](https://tympanus.net/codrops/author/anderson/) in [Tutorials](https://tympanus.net/codrops/category/tutorials/) on April 25, 2022

# Case Study: Windland — An Immersive Three.js Experience

A look into the making of a mini-city full of post effects and micro-interactions using Three.js.

[case study](https://tympanus.net/codrops/tag/case-study/) [postprocessing](https://tympanus.net/codrops/tag/postprocessing/) [Three.js](https://tympanus.net/codrops/tag/three-js/) [WebGL](https://tympanus.net/codrops/tag/webgl/)

In this article we’ll look at the creation of a mini-city full of post effects and micro-interactions using Three.js.

[Visit Windland](https://windland-neotix.vercel.app/)

See **how you can create your own** using [this free boilerplate](https://github.com/ektogamat/threejs-andy-bolierplate) .

## **Introduction**

I am an unconditional game lover. I’ve always dreamed of creating an interactive mini-city, using saturated colors, similar to SimCity and alike. The challenge was that I had neither enough 3D knowledge nor a library.

At the end of 2021, I finally decided to fulfill an old desire and I took Bruno Simon’s course – [Three.js Journey](https://threejs-journey.com/) . I’m a designer who likes to program. I ended up discovering myself as a creative developer because of this course, where I was able to use part of my dormant knowledge of ActionScript 2.0, from the late Macromedia Flash.

The entire project was created in approximately 2 weeks, between shifts at my work at Neotix. It felt amazing and I loved doing it, so I decided to share some interesting information about it, so that I could help in some way those who are at the beginning of this journey.

## **Creative challenge**

It was crucial to use various post-processing effects present in games to give this city a decent level of realism without affecting performance. The artistic path I chose to follow was to use a mix of realistic lights with low-poly models.

image3.png Image showing a 3D model of the city and the Three.js experience next to it.

## **Performance**

Part of what I wanted with this project was to apply techniques that would perform well on different devices, especially mobile. It needed to work on as many devices as possible, with an acceptable frame rate (at least 30 fps). I also wanted the experience to load as quickly as possible, with a file size smaller than 2MB.

In order to accomplish this, I had to use a series of techniques that I will describe below.

Image showing the wireframe on the model within Blender of the model, where it all started.

## **Creating the 3D model in Blender**

I used Blender to make the city model. I imported part of the buildings from free templates on the Internet. I modified a few of them to better match the setting. To make the terrain, I used Blender’s sculpt mode, creating valleys and peaks that look beautiful with light and shadow.

Image showing the 3D model in Blender in wireframe mode.

Each model was optimized considering the number of triangles when exporting. I chose to use the GLB format because the compression with [Draco](https://google.github.io/draco/) does incredible compression – sometimes 7x smaller, in file size. In addition, all project resources are also compressed at runtime, on the server with gzip, for a more reduced transfer.

## **Creating natural light**

Lighting in games is fascinating – the way shadow interacts with the terrain in order to create a scene that’s pleasing to the eye while not being held back by reality. I used Blender’s global lighting system, with a “world” node, using “Nishita” ambient lighting. This allows for very natural lighting, with ambient settings that quickly give a pleasing result.

[](https://codrops-1f606.kxcdn.com/codrops/wp-content/uploads/2022/04/04.jpg?x57826) Image showing the lighting of the sun in different positions and superimposed on the blender’s nishita sun parameter.

## **Distributing trees in Blender with geometry nodes**

Trees play an important role, as they help create a cast shadow that gives the terrain a touch of realism. I used Blender’s GeometryNodes to distribute the trees in the model and create a variation in size, shape, and rotation. I also used the material selector, to choose the regions that would have more or fewer trees, painting the density with the material selection.

[](https://codrops-1f606.kxcdn.com/codrops/wp-content/uploads/2022/04/05.jpg?x57826) Image showing the blender interface with the geometry nodes created to distribute the trees in the scene.

## **Bake lighting for export**

In order for the experience to function and perform well in Three.js, it’s important that the scene loads the lighting baked into the textures. I created a single texture for the floor of 2048×2048, containing all of the shadows. The process of how to do the bake of shadows can be found in several tutorials on the internet. The end result is impressive and has no impact on performance.

[](https://codrops-1f606.kxcdn.com/codrops/wp-content/uploads/2022/04/06.jpg?x57826) Image showing the 3D model in blender with the baked lighting texture.

## **Export to Three.js and the tree performance issue**

After finishing the bake and connecting the texture to the color node in the ground mesh, I exported all of the meshes to GLTF format. The entire model, using DRACO COMPRESSION, is 1.2MB. However, we have a problem with the trees: they cannot be exported all at once, as it would take too long for the GPU to finish the process.

I created the trees using the MESH SURFACE SAMPLER from Three.js, which serves exactly this purpose. You can use a model and distribute it on a surface, creating variations of the same model, but making modifications to each of them. Thus, the performance is incredible, even with a very large number of variations.

You can see [an example](https://threejs.org/docs//en/math/MeshSurfaceSampler) of this in the official Three.js documentation.

[](https://codrops-1f606.kxcdn.com/codrops/wp-content/uploads/2022/04/07.jpg?x57826) Image showing the MeshSurfaceSampler code inside the VSCODE and the Three.js scene image with the projected trees.

## **Loading everything in Three.js**

Using my boilerplate (see more about this at the end of the article), which I created to simplify things, I loaded the exported model. Afterwards, I spent a lot of time adjusting the light coloring, intensities, and other small details that make all the difference. The result of rendering in 3D is no always great for the experience in Three.js using the default parameters.

Image showing the evolution of the model within the Three.js and the color changes as a before and after.

It is essential to use the DAT.GUI to be able to visually adjust the parameters. It is impossible to get the colors and intensities right by guessing the numbers.

Image showing the Three.js DAT.GUI highlighted

## **Using VertexShader for the animation of the trees**

One thing that brings reality to the scene is the smooth animation of the trees. Doing this is possible by exporting the animation directly from Blender, but performance would be greatly impacted – especially given the large number of trees.

The best approach in these cases is to animate using VertexShader, using GPU processing directly on the positioning of vertices in the 3D world. With that, the performance is very good and the animations are beautiful.

[](https://codrops-1f606.kxcdn.com/codrops/wp-content/uploads/2022/04/010.jpg?x57826) VSCODE screenshot showing part of the vertex shader responsible for animating the trees along with an image of the animated trees inside the Three.js

## **Animating the birds and other elements of the experience**

The other animated elements of the experience, such as the helicopter, car, and wind turbines, were animated by changing the rotation of the model pieces directly in the render loop. It’s a very simple way to animate.

The birds were animated differently. I wanted them to have wing movement and a sense of grouping. So, I animated the whole group inside blender and exported the animation along with the GLFT file. I used the Animation Mixer to animate the wings while changing the group’s position. The result is quite convincing and very lightweight (only 200kb).

Image showing the birds and their animation timeline inside blender and the same birds inside Three.js.

## **Lights, shadows, and the night mode + apocalyptic**

As the shadows are baked inside the imported GLB file, I was able to gain some performance by not having to use a dynamically generated shadow map inside Three.js.

I played around with the lighting effects, creating a night mode and an apocalyptic mode. It’s a lot of fun to have that kind of creative freedom without having to modify the template. The possibilities are endless.

The apocalyptic mode is an easter egg, accessible to anyone who knows how to activate it :).

Image showing night mode and apocalyptic mode.

## **Post Processing with Effect Composer**

I’ve always loved the depth-of-field effect in games, but I thought it would be very difficult to use something like that in a Three.js experience. Thanks to the latest updates to the library, it’s much easier.

Using EffectComposer, I was able to use the BokehPass effect in day mode, which generates a dynamic depth-of-field effect, based on the distance from the camera. For night mode, I use UnrealBlooomPass, which makes the lights super exposed, ideal for this type of situation.

I change the effects between night and day mode for performance reasons – using the insertPass() and removePass() methods.

## **Clicking and Selecting a Building**

A lot of people asked me how to make buildings clickable UI items. This was done using Three.js’ RayCaster, which detects an intersection between an invisible ray, fired by the camera, and the mouse. With this, I can detect when a building has been selected and – based on its name – trigger an event.

Image showing the source code inside the VSCODE responsible for making the object selection raycaster and the camera animation.

The animations that happen when clicking on a building were done using TWEEN.JS, by animating the initial camera position into the position of the clicked building. That way, I can place multiple buildings and have an animation generated automatically.

## **Responsive tweaks: Also working on mobile**

Part of the work also involved tweaking the experience parameters to work well on mobile devices. Not just the responsive adjustments to the HTML and CSS, but also to the camera parameters, animation duration, and several other details.

image16.jpg Image showing Windland running in mobile mode with responsiveness.

## **Dynamic quality: Adjusting performance dynamically with the power of the user device**

Despite all the optimizations, some devices still cannot run all the effects, especially the post-processing ones. So I created a script that measures the FPS at the beginning of the experiment (during the loading process). That way, when the experiment starts, Three.js knows whether or not to activate certain effects to save on processing and ensure that the performance is within what is possible for that device.

[image9.png](https://lh3.googleusercontent.com/aSntMfbWasHTNyHUcrVpQAHxbB_smec_9pVdbpC64Ddq9v-D_lanALjXVFKkFQjRPLx5L32SI9R4bcjz1WfKX1pMdILqNgOwVJgc7Ek7omBJvusdQe5BSDOIhXvf--2d3yKHYWDl) Image showing code inside the VSCODE responsible for detecting the FPS.

## **Also working on smartwatches**

As a proof of concept, I wanted to demonstrate that experiments done in Three.js are not heavy to process and run even on a smartwatch. During this process, I found that the number of vertices in the model is what would most impact performance on these devices. So, I created an “ultra-low poly” mode of the model to be used on mobile devices. Ready! Nothing else in the code needed to be changed.

image8.png Image showing Windland running on a smartwatch

## **Three.js Boilerplate: Create your own Windland**

To make it easier to create projects in Three.js, I’ve created an easy-to-use, well-documented, and [free starter project](https://github.com/ektogamat/threejs-andy-bolierplate) . So, using this boilerplate, you will be able to create a scene in Three.js in just a few lines and import a model. The boilerplate also has instructions on how to export the model and some other information that can help you create your city.

Find the repository on GitHub: <https://github.com/ektogamat/threejs-andy-bolierplate>

Watch the video on how to use it: [https://www.youtube.com/watch?v=qM6Ih\_cC6Gc](https://www.youtube.com/watch?v=qM6Ih_cC6Gc)

[image17.png](https://github.com/ektogamat/threejs-andy-bolierplate)

## **Interesting facts**

Some people ask: What is the advantage of making a project using Three.js and not just use a rendered image for a website? Well, a rendered image of this scene at 1920×1080 is approximately 2.8mb in size, with reasonable compression. This whole scene in Three.js, with all its interactivity, animations, interface and everything you see in the animations is only 1.8mb.

Windland was awarded an [Honorable Mention at Awwwards](https://www.awwwards.com/sites/windland-threejs-experiment) on March 31, 2022. It transformed itself from a test project into a Three.js use case to complex scenes that mimic the look and feel of games.

Three.js is increasingly my favorite library. You can find more videos on [my YouTube channel](https://www.youtube.com/c/andersonmancini) or on my official [Twitter](https://twitter.com/Andersonmancini) .

Thanks for your time 🙂

[case study](https://tympanus.net/codrops/tag/case-study/) [postprocessing](https://tympanus.net/codrops/tag/postprocessing/) [Three.js](https://tympanus.net/codrops/tag/three-js/) [WebGL](https://tympanus.net/codrops/tag/webgl/)

### [Anderson Mancini](https://tympanus.net/codrops/author/anderson/)

Anderson Mancini is a creative developer from Brasilia, DF. Leading a digital transformation agency - Neotix. I'm also a content producer about Three.js on Youtube and a teacher in some courses throughout the year. Curious about Three.js and Shaders. I love to learn every day.

* [Website](https://neotix.com.br/)
* [X](https://twitter.com/Andersonmancini)
* [LinkedIn](https://www.linkedin.com/in/anderson-mancini/)
* [Behance](https://www.behance.net/ektogamat)
* [Github](https://github.com/ektogamat)

### Creative Spotlights

Inside the journeys and portfolios of today's most inspiring designers and developers .

### Studio Stories

Discover how studios & agencies started, how they work, and what they've built.

Read their stories

### Case Studies

Discover the ideas, design, and craft behind today’s most inspiring web experiences.

View all Case Studies

### Learn with Tutorials

Level up your front-end skills with practical, step-by-step tutorials.

View all Tutorials

### C reative Hu b

A growing showcase of Codrops originals and hand-picked demos from the creative web.

[](https://tympanus.net/codrops/hub/)

Start exploring

### 

💎✨ Discover fresh gems in our handpicked exhibition of over 2,000 standout websites that caught our eye.

Get inspired

##### Follow Codrops

* [LinkedIn](https://www.linkedin.com/company/codrops)
* [Instagram](https://instagram.com/codropsss)
* [Facebook](https://www.facebook.com/codrops)
* [X (Twitter)](http://www.x.com/codrops)
* [Bluesky](https://bsky.app/profile/codrops.bsky.social)
* [Telegram](https://t.me/codrops)
* [RSS Feed](https://tympanus.net/codrops/feed/)
* [GitHub](https://github.com/codrops)

* **Content delivered by** [](https://www.keycdn.com/ "Content Distribution Network")
* © Codrops 2026

[Support us on Patreon logo](https://www.patreon.com/bePatron?u=2516316)