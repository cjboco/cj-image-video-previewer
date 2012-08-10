CJ Image Video Previewer 2.0 Demo
=======================

A JQuery Plug-In to Display A Series of Image Frames, Like A Video Previewer
Implementing the plug-in is pretty straight foward, you just need to have a container that contains a single image. The plug-in is passed an array of images to use for the animated preview.


### User Options ###

You also have the option to pass the delay amount between frames. There's a built in method to ensure that images are loaded prior to continuing. In theory it should scale up nicely. And because of this, I have built in a Progress Indicator. You have the option to turn this on or off.

| Argument     | Description                                                                                                                                                | Default   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| images       | This should be an array object of image sources. Example: ['images/myimage1.jpg','images/myimage2.jpg']                                                    | []        |
| autoPlay     | Determines if the preview starts automatically. If you set this to false, then you will need to start the frameshow by calling $("#MyframeShow").start();  | false     |
| delay        | The delay in miliseconds between frame transitions.                                                                                                        | 450       |
| showProgress | Determines wether or not to display the progress bar.                                                                                                      | true      |