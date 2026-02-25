import { SetStateAction, Dispatch, useEffect, useRef } from "react";
import {
  AbstractMesh,
  ArcRotateCamera,
  Engine,
  ImportMeshAsync,
  Scene,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  Color3,
  Color4,
  Texture,
  CubeTexture,
  PBRMaterial,
  TransformNode,
  MeshBuilder,
  Animation,
  Animatable,
  CubicEase,
  EasingFunction,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/inspector";
import { Track } from "src/types";

type Imported = { root: AbstractMesh; mesh: AbstractMesh };

const TARGET_SIZE = 2;

const importModuleToScene = async (
  module: string,
  scene: Scene
): Promise<Imported | null> => {
  const res = await ImportMeshAsync(module, scene, {
    pluginExtension: ".glb",
  });

  const mesh = res.meshes.find((mesh) => mesh.getTotalVertices() > 0);

  if (!mesh) return null;

  mesh.computeWorldMatrix(true);

  const { min, max } = mesh.getHierarchyBoundingVectors(true);
  const size = max.subtract(min);

  const maxDim = Math.max(size.x, size.y, size.z);

  const root = res.meshes[0];

  if (maxDim <= 1e-6) return { root, mesh };

  const scale = TARGET_SIZE / maxDim;

  root.scaling = new Vector3(scale, scale, scale);
  root.computeWorldMatrix(true);

  return { root, mesh };
};

const changePosition = (mesh: AbstractMesh, position: Vector3) => {
  mesh.position.copyFrom(position);
  mesh.computeWorldMatrix(true);
};

const changeScale = (mesh: AbstractMesh, scale: number) => {
  mesh.scaling.y = scale;
  mesh.scaling.x = scale;
  mesh.scaling.z = scale;
  mesh.computeWorldMatrix(true);
};

const placeCenterOnDisc = (disc: Imported, center: Imported) => {
  disc.mesh.computeWorldMatrix(true);
  center.mesh.computeWorldMatrix(true);

  const discBB = disc.mesh.getHierarchyBoundingVectors(true);
  const centerBB = center.mesh.getHierarchyBoundingVectors(true);

  const discCenterXZ = discBB.min.add(discBB.max).scale(0.5);
  const centerCenter = centerBB.min.add(centerBB.max).scale(0.5);

  const dx = discCenterXZ.x - centerCenter.x;
  const dz = discCenterXZ.z - centerCenter.z;
  center.root.position.addInPlace(new Vector3(dx, 0, dz));

  const discTopY = discBB.max.y;

  const centerBB2 = center.mesh.getHierarchyBoundingVectors(true);
  const centerBottomY = centerBB2.min.y;

  const dy = discTopY - centerBottomY + 0.001;
  center.root.position.addInPlace(new Vector3(0, dy, 0));

  center.root.computeWorldMatrix(true);
};

const playTonearmAnim = (
  scene: Scene,
  pivotNode: TransformNode,
  startAngle: number,
  endAngle: number,
  isReverse: boolean
) => {
  return new Promise<void>((resolve) => {
    const fps = 60;
    const totalFrames = 40;

    const anim = new Animation(
      "tonearmRotate",
      "rotation.y",
      fps,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    anim.setKeys([
      { frame: 0, value: isReverse ? endAngle : startAngle },
      { frame: totalFrames, value: isReverse ? startAngle : endAngle },
    ]);

    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    anim.setEasingFunction(ease);

    scene.stopAnimation(pivotNode);

    const animation = scene.beginDirectAnimation(
      pivotNode,
      [anim],
      0,
      totalFrames,
      false
    );

    animation.onAnimationEndObservable.add(() => {
      resolve();
    });
  });
};

const playTonearmLiftAnim = (
  scene: Scene,
  pivotNode: TransformNode,
  liftAngle: number,
  isReverse: boolean
) => {
  return new Promise<void>((resolve) => {
    const fps = 60;
    const totalFrames = 30;

    const animLiftZ = new Animation(
      "tonearmLift",
      "rotation.z",
      fps,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const animLiftX = new Animation(
      "tonearmLift",
      "rotation.x",
      fps,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    animLiftZ.setKeys([
      { frame: 0, value: isReverse ? liftAngle : 0 },
      { frame: totalFrames, value: isReverse ? 0 : liftAngle },
    ]);

    animLiftX.setKeys([
      { frame: 0, value: isReverse ? liftAngle : 0 },
      { frame: totalFrames, value: isReverse ? 0 : liftAngle },
    ]);

    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    animLiftZ.setEasingFunction(ease);
    animLiftX.setEasingFunction(ease);

    scene.stopAnimation(pivotNode);

    const animation = scene.beginDirectAnimation(
      pivotNode,
      [animLiftZ, animLiftX],
      0,
      totalFrames,
      false
    );

    animation.onAnimationEndObservable.add(() => {
      resolve();
    });
  });
};

const playDiscPositionAnim = (
  scene: Scene,
  spinPivotNode: TransformNode,
  isReverse: boolean
) => {
  return new Promise<void>((resolve) => {
    spinPivotNode.rotationQuaternion = null;

    const fps = 60;
    const totalFrames = 60;

    const anim = new Animation(
      "spinPivotPosition",
      "position",
      fps,
      Animation.ANIMATIONTYPE_VECTOR3,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    anim.setKeys([
      {
        frame: 0,
        value: isReverse
          ? new Vector3(3.06, 3.7, 0.7)
          : new Vector3(0.06, 3.45, 0.7),
      },
      {
        frame: totalFrames / 2,
        value: isReverse
          ? new Vector3(0.06, 3.7, 0.7)
          : new Vector3(0.06, 3.7, 0.7),
      },
      {
        frame: totalFrames,
        value: isReverse
          ? new Vector3(0.06, 3.45, 0.7)
          : new Vector3(3.06, 3.7, 0.7),
      },
    ]);

    scene.stopAnimation(spinPivotNode);

    const animation = scene.beginDirectAnimation(
      spinPivotNode,
      [anim],
      0,
      totalFrames,
      false
    );

    animation.onAnimationEndObservable.add(() => {
      resolve();
    });
  });
};

const startDiscSpin = (
  scene: Scene,
  pivot: TransformNode
): Promise<Animatable> => {
  return new Promise((resolve) => {
    const fps = 60;
    const totalFrames = 100;
    const startAngle = pivot.rotation.y || 0;

    const anim = new Animation(
      "discRotate",
      "rotation.y",
      fps,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    anim.setKeys([
      { frame: 0, value: startAngle },
      { frame: totalFrames, value: startAngle + Math.PI * 2 },
    ]);

    scene.stopAnimation(pivot);

    const animatable = scene.beginDirectAnimation(
      pivot,
      [anim],
      0,
      totalFrames,
      true
    );
    animatable.speedRatio = 0;

    const accelDuration = 1500;
    const startTime = performance.now();

    const update = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / accelDuration, 1);
      animatable.speedRatio = t * t;

      if (t < 1) {
        requestAnimationFrame(update);
      } else {
        animatable.speedRatio = 1;
        resolve(animatable);
      }
    };

    requestAnimationFrame(update);
  });
};

const stopDiscSpin = (animatable: Animatable): Promise<void> => {
  return new Promise((resolve) => {
    const decelDuration = 1500;
    const startTime = performance.now();

    const update = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / decelDuration, 1);
      const remaining = 1 - t;
      animatable.speedRatio = remaining * remaining;

      if (t < 1) {
        requestAnimationFrame(update);
      } else {
        animatable.speedRatio = 0;
        animatable.stop();
        resolve();
      }
    };

    requestAnimationFrame(update);
  });
};

const changeDiscImage = (
  selectedTrack: Track,
  scene: Scene,
  centerMesh: Imported
) => {
  return new Promise<void>((resolve) => {
    const texture = new Texture(selectedTrack.previewPath, scene);
    texture.uScale = 5;
    texture.vScale = 5;

    const material = new PBRMaterial("material", scene);
    material.albedoTexture = texture;
    material.metallic = 0;

    centerMesh.root.getChildMeshes().forEach((m) => {
      if (m.getTotalVertices() > 0) m.material = material;
    });

    resolve();
  });
};

const TONEARM_START_ANGLE = Math.PI / 0.824;
const TONEARM_END_ANGLE = Math.PI / 1.07;
const TONEARM_LIFT_ANGLE = -((10 * Math.PI) / 180);

const DISC_COORDS = new Vector3(-0.115, -1, -1.398);

const SPIN_PIVOT_POSITION = new Vector3(0.06, 3.45, 0.7);

type Props = {
  selectedTrack: Track | null;
  setShouldPlaying: Dispatch<SetStateAction<boolean>>;
};

export const Vinyl = ({ selectedTrack, setShouldPlaying }: Props) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene>(null);
  const engine = useRef<Engine>(null);
  const camera = useRef<ArcRotateCamera>(null);
  const light = useRef<HemisphericLight>(null);

  const pivotNodeRef = useRef<TransformNode | null>(null);
  const spinPivotNodeRef = useRef<TransformNode | null>(null);
  const centerMeshRef = useRef<Imported | null>(null);
  const discMeshRef = useRef<Imported | null>(null);
  const spinAnimRef = useRef<Animatable | null>(null);

  // Initialize Babylon.js
  useEffect(() => {
    const canvasElement = canvas.current;

    if (!canvasElement || engine.current) return;

    engine.current = new Engine(canvasElement, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      alpha: true,
    });
    scene.current = new Scene(engine.current);
    scene.current.clearColor = new Color4(0, 0, 0, 0);

    engine.current.runRenderLoop(() => {
      scene.current?.render();
    });

    camera.current = new ArcRotateCamera(
      "camera",
      Math.PI / 0.63,
      Math.PI / 3.8,
      3.1,
      new Vector3(0.1, 3.6, 0.3),
      scene.current
    );

    camera.current.lowerAlphaLimit = camera.current.alpha;
    camera.current.upperAlphaLimit = camera.current.alpha;
    camera.current.lowerBetaLimit = 0;
    camera.current.upperBetaLimit = Math.PI / 1.5;
    camera.current.attachControl(canvasElement, true);

    light.current = new HemisphericLight(
      "hemiLight",
      new Vector3(-0.6, 1, 0.3),
      scene.current
    );
    light.current.intensity = 1.2;
    light.current.diffuse = new Color3(1.0, 0.96, 0.9);
    light.current.specular = new Color3(1.0, 0.97, 0.92);
    light.current.groundColor = new Color3(0.85, 0.76, 0.66);

    const keyLight = new DirectionalLight(
      "keyLight",
      new Vector3(-0.75, -0.55, 0.3),
      scene.current
    );
    keyLight.intensity = 0.9;
    keyLight.diffuse = new Color3(1.0, 0.94, 0.84);
    keyLight.specular = new Color3(1.0, 0.97, 0.92);

    const frontLight = new DirectionalLight(
      "frontLight",
      new Vector3(-0.5, -0.7, -0.4),
      scene.current
    );
    frontLight.intensity = 0.55;
    frontLight.diffuse = new Color3(1.0, 0.92, 0.82);
    frontLight.specular = new Color3(1.0, 0.96, 0.9);

    const fillLight = new PointLight(
      "fillLight",
      new Vector3(-2, 6, 1),
      scene.current
    );
    fillLight.intensity = 0.4;
    fillLight.diffuse = new Color3(1.0, 0.9, 0.78);

    const rimLight = new DirectionalLight(
      "rimLight",
      new Vector3(0.7, -0.4, -0.6),
      scene.current
    );
    rimLight.intensity = 0.9;
    rimLight.diffuse = new Color3(1.0, 0.88, 0.72);

    scene.current.environmentTexture = CubeTexture.CreateFromPrefilteredData(
      "https://assets.babylonjs.com/environments/environmentSpecular.env",
      scene.current
    );
    scene.current.environmentIntensity = 0.6;

    scene.current.imageProcessingConfiguration.contrast = 1;
    scene.current.imageProcessingConfiguration.exposure = 1.15;
    scene.current.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.current.imageProcessingConfiguration.toneMappingType = 1;

    // scene.current.debugLayer.show({ embedMode: true });

    return () => {
      engine.current?.dispose();
      engine.current = null;
      camera.current = null;
    };
  }, [canvas]);

  // Load the modules and set up the scene
  useEffect(() => {
    const sceneElement = scene.current;

    if (!sceneElement || centerMeshRef.current) return;

    const loadModules = async () => {
      const worldRoot = new TransformNode("worldRoot", sceneElement);

      worldRoot.scaling = new Vector3(-1, 1, 1);

      worldRoot.computeWorldMatrix(true);

      const discMesh = await importModuleToScene(
        "/vinyl-model/disc.glb",
        sceneElement
      );

      if (!discMesh) return;

      discMeshRef.current = discMesh;

      const centerMesh = await importModuleToScene(
        "/vinyl-model/center.glb",
        sceneElement
      );

      if (!centerMesh) return;

      centerMeshRef.current = centerMesh;

      changeScale(centerMesh.root, 3.3);
      changeScale(discMesh.root, 8);

      changePosition(
        discMesh.root,
        new Vector3(DISC_COORDS.x, DISC_COORDS.y, DISC_COORDS.z)
      );
      changePosition(
        centerMesh.root,
        new Vector3(DISC_COORDS.x, DISC_COORDS.y, DISC_COORDS.z)
      );

      placeCenterOnDisc(discMesh, centerMesh);

      // const t = MeshBuilder.CreateBox("t", { size: 0.02 }, sceneElement);
      // changePosition(t, new Vector3(0.06, 3.45, 0.7));
      // t.computeWorldMatrix(true);

      const spinPivotNode = new TransformNode("spinPivot", sceneElement);
      spinPivotNode.position = SPIN_PIVOT_POSITION;
      spinPivotNode.parent = worldRoot;
      spinPivotNode.computeWorldMatrix(true);
      spinPivotNodeRef.current = spinPivotNode;
      discMesh.root.parent = spinPivotNode;
      centerMesh.root.parent = spinPivotNode;

      const tonearmMesh = await importModuleToScene(
        "/vinyl-model/tonearm.glb",
        sceneElement
      );

      if (!tonearmMesh) return;

      changeScale(tonearmMesh.root, 4);
      changePosition(tonearmMesh.root, new Vector3(-0.79, -0.48, 0.88));

      // const t = MeshBuilder.CreateBox("t", { size: 0.05 }, sceneElement);
      // changePosition(t, new Vector3(-0.749, 3.45, 0.85));
      // t.computeWorldMatrix(true);

      const pivotNode = new TransformNode("pivot", sceneElement);
      pivotNode.position = new Vector3(-0.749, 3.45, 0.85);
      pivotNode.parent = worldRoot;
      pivotNode.computeWorldMatrix(true);
      pivotNodeRef.current = pivotNode;
      tonearmMesh.root.parent = pivotNode;

      tonearmMesh.root.rotationQuaternion = null;
      tonearmMesh.root.computeWorldMatrix(true);

      pivotNode.rotationQuaternion = null;
      pivotNode.rotation.y = TONEARM_END_ANGLE;

      const vinylMesh = await importModuleToScene(
        "/vinyl-model/vinyl.glb",
        sceneElement
      );

      if (!vinylMesh) return;

      vinylMesh.root.rotation.x = Math.PI;

      changePosition(vinylMesh.root, new Vector3(0, 2.97, 0));

      // t.parent = worldRoot;
      vinylMesh.root.parent = worldRoot;
    };

    loadModules();
  }, [scene]);

  // Animate the model when the selected track changes
  useEffect(() => {
    const pivotNode = pivotNodeRef.current;
    const spinPivotNode = spinPivotNodeRef.current;
    const sceneElement = scene.current;
    const centerMesh = centerMeshRef.current;
    const discMesh = discMeshRef.current;

    if (
      !pivotNode ||
      !sceneElement ||
      !spinPivotNode ||
      !selectedTrack ||
      !centerMesh ||
      !discMesh
    )
      return;

    const runAnimations = async () => {
      setShouldPlaying(false);

      if (spinAnimRef.current) {
        await stopDiscSpin(spinAnimRef.current);
        spinAnimRef.current = null;
      }

      await playTonearmLiftAnim(
        sceneElement,
        pivotNode,
        TONEARM_LIFT_ANGLE,
        false
      );

      await playTonearmAnim(
        sceneElement,
        pivotNode,
        TONEARM_START_ANGLE,
        TONEARM_END_ANGLE,
        true
      );

      await playTonearmLiftAnim(
        sceneElement,
        pivotNode,
        TONEARM_LIFT_ANGLE,
        true
      );

      await playDiscPositionAnim(sceneElement, spinPivotNode, false);

      await changeDiscImage(selectedTrack, sceneElement, centerMesh);

      await playDiscPositionAnim(sceneElement, spinPivotNode, true);

      await playTonearmLiftAnim(
        sceneElement,
        pivotNode,
        TONEARM_LIFT_ANGLE,
        false
      );

      await playTonearmAnim(
        sceneElement,
        pivotNode,
        TONEARM_START_ANGLE,
        TONEARM_END_ANGLE,
        false
      );

      await playTonearmLiftAnim(
        sceneElement,
        pivotNode,
        TONEARM_LIFT_ANGLE,
        true
      );

      setShouldPlaying(true);

      spinAnimRef.current = await startDiscSpin(sceneElement, spinPivotNode);
    };

    runAnimations();
  }, [pivotNodeRef, scene, selectedTrack, setShouldPlaying]);

  return (
    <div className="h-full flex-1 w-[70%]">
      <canvas
        className="hover:cursor-grab focus:outline-0"
        style={{ width: "100%", height: "100%" }}
        ref={canvas}
      />
    </div>
  );
};
