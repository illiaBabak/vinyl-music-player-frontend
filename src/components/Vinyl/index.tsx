import { useEffect, useRef } from "react";
import {
  AbstractMesh,
  ArcRotateCamera,
  Camera,
  Engine,
  ImportMeshAsync,
  Scene,
  Vector3,
  HemisphericLight,
  Color4,
} from "@babylonjs/core";
import "@babylonjs/loaders";

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

export const Vinyl = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene>(null);
  const engine = useRef<Engine>(null);
  const camera = useRef<Camera>(null);
  const light = useRef<HemisphericLight>(null);

  // Initialize Babylon.js
  useEffect(() => {
    const canvasElement = canvas.current;

    if (!canvasElement) return;

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
      Math.PI / 0.62,
      Math.PI / 3,
      2.15,
      new Vector3(0.22, 3.7, 0),
      scene.current
    );

    camera.current.attachControl(canvasElement, true);

    light.current = new HemisphericLight(
      "light",
      new Vector3(0, 1, 0),
      scene.current
    );

    return () => {
      engine.current?.dispose();
      engine.current = null;
      camera.current = null;
    };
  }, [canvas]);

  useEffect(() => {
    const sceneElement = scene.current;

    if (!sceneElement) return;

    const loadModules = async () => {
      const discMesh = await importModuleToScene(
        "/vinyl-model/disc.glb",
        sceneElement
      );

      if (!discMesh) return;

      const centerMesh = await importModuleToScene(
        "/vinyl-model/center.glb",
        sceneElement
      );

      if (!centerMesh) return;

      changeScale(centerMesh.root, 3.3);
      changeScale(discMesh.root, 8);

      const discCoords = { x: -0.05, y: 2.49, z: -0.7 };

      changePosition(
        discMesh.root,
        new Vector3(discCoords.x, discCoords.y, discCoords.z)
      );
      changePosition(
        centerMesh.root,
        new Vector3(discCoords.x, discCoords.y, discCoords.z)
      );

      placeCenterOnDisc(discMesh, centerMesh);

      const tonearmMesh = await importModuleToScene(
        "/vinyl-model/tonearm.glb",
        sceneElement
      );

      if (!tonearmMesh) return;

      changeScale(tonearmMesh.root, 6.5);
      changePosition(tonearmMesh.root, new Vector3(0.7, 2.703, -0.7));

      const vinylMesh = await importModuleToScene(
        "/vinyl-model/empty-vinyl.glb",
        sceneElement
      );

      if (!vinylMesh) return;

      changePosition(vinylMesh.root, new Vector3(0, 3, 0));
    };

    loadModules();
  }, [scene]);

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
