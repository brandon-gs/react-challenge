import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";
import "./styles.css";

const App = () => {
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [images, setImages] = useState([]);
  const [elementGuidelines, setElementGuidelines] = React.useState([]);

  /**
   * Add a new moveable component to the moveableComponents array, and update the state
   */
  const addMoveable = () => {
    setMoveableComponents([
      ...moveableComponents,
      {
        id: Math.floor(Math.random() * Date.now()),
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        updateEnd: true,
      },
    ]);
  };

  /**
   * Update the moveable component with the provided properties, and update the state
   * @param {number} id - ID of the moveable component that will be updated
   * @param {Object} newComponent - The new properties of the moveable component
   * @param {boolean} [updateEnd=false] - Indicates if the update is caused by the end of a resize or drag event
   */
  const updateMoveable = (id, newComponent, updateEnd = false) => {
    const updatedMoveables = moveableComponents.map((moveable, i) => {
      if (moveable.id === id) {
        return { id, ...newComponent, updateEnd };
      }
      return moveable;
    });
    setMoveableComponents(updatedMoveables);
  };

  /**
   * Remove the moveable component at the given index of the array, and update the state
   * @param {number} index - Index of the moveable component that will be deleted.
   */
  const deleteMoveableItem = (index) => () => {
    const currentItems = [...moveableComponents];
    currentItems.splice(index, 1);
    setMoveableComponents(currentItems);
  };

  /**
   * useEffect hook that fetches a list of images from a remote API
   * using AbortController to cancel the fetch in case the component unmounts before fetch is completed
   * - fetch images from remote API and save it in the local state
   * - select elements and save it in the local state
   * - return a cleanup function that calls abort() on the AbortController to cancel fetch in case component unmount
   */
  useEffect(() => {
    const controller = new AbortController();
    const getPhotos = async () => {
      const response = await (
        await fetch("https://jsonplaceholder.typicode.com/photos", {
          signal: controller.signal,
        })
      ).json();
      setImages(response);
    };
    getPhotos();
    setElementGuidelines([
      document.querySelector(".nested.rotate"),
      document.querySelector(".nested.scale"),
      document.querySelector(".nested.first"),
    ]);
    // Abort request in case component unmount before it is completed
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main className="main">
      <p className="title">
        Presiona click derecho sobre un elemento para <b>eliminarlo!</b>
      </p>
      <button
        className="button"
        onClick={addMoveable}
        disabled={images.length === 0}
      >
        + Add Moveable
      </button>
      <div className="component_container" id="parent">
        {moveableComponents.map((item, index) => (
          <Component
            {...item}
            key={index}
            updateMoveable={updateMoveable}
            setSelected={setSelected}
            isSelected={selected === item.id}
            image={images[index]}
            deleteMoveableItem={deleteMoveableItem(index)}
            elementGuidelines={elementGuidelines}
          />
        ))}
      </div>
    </main>
  );
};

export default App;

const Component = ({
  updateMoveable,
  top,
  left,
  width,
  height,
  index,
  color,
  id,
  setSelected,
  isSelected = false,
  image,
  deleteMoveableItem,
  elementGuidelines,
}) => {
  const ref = useRef();

  const [randomObjectFit] = useState(getRandomObjectFit());
  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    index,
    color,
    id,
  });

  let parent = document.getElementById("parent");
  let parentBounds = parent?.getBoundingClientRect();

  /**
   * This function handles the resize event of a moveable object.
   * @param {Object} e - Event object with information about the resize event
   * The function updates the moveable object's dimensions, position and color.
   * And also updates the reference node's width, height, translateX, translateY and position
   */
  const onResize = (e) => {
    // ACTUALIZAR ALTO Y ANCHO
    let newWidth = e.width;
    let newHeight = e.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    updateMoveable(id, {
      top,
      left,
      width: newWidth,
      height: newHeight,
      color,
    });

    // ACTUALIZAR NODO REFERENCIA
    const beforeTranslate = e.drag.beforeTranslate;

    ref.current.style.width = `${e.width}px`;
    ref.current.style.height = `${e.height}px`;

    let translateX = beforeTranslate[0];
    let translateY = beforeTranslate[1];

    ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`;

    setNodoReferencia({
      ...nodoReferencia,
      translateX,
      translateY,
      top: top + translateY < 0 ? 0 : top + translateY,
      left: left + translateX < 0 ? 0 : left + translateX,
    });
  };

  /**
   * This function handles the resize end event of a moveable object.
   * @param {Object} e - Event object with information about the resize event
   * The function updates the moveable object's dimensions and position, and color if provided and it set the flag as true
   * to mark the event as finished.
   */
  const onResizeEnd = (e) => {
    let newWidth = e.lastEvent?.width;
    let newHeight = e.lastEvent?.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    updateMoveable(
      id,
      {
        top,
        left,
        width: newWidth,
        height: newHeight,
        color,
      },
      true
    );
  };

  return (
    <>
      <img
        src={image.url}
        alt={id}
        ref={ref}
        className="item draggable"
        id={"component-" + id}
        style={{
          top: top,
          left: left,
          width: width,
          height: height,
          objectFit: randomObjectFit,
        }}
        onClick={() => setSelected(id)}
        onContextMenu={(e) => {
          e.preventDefault();
          deleteMoveableItem();
        }}
      />

      <Moveable
        target={isSelected && ref.current}
        bounds={{
          left: parentBounds?.left - parentBounds.x,
          top: parentBounds?.top - parentBounds.y,
          right: parentBounds?.right - parentBounds.x,
          bottom: parentBounds?.bottom - parentBounds.y,
        }}
        elementGuidelines={elementGuidelines}
        horizontalGuidelines={getArrayGuidelines(100, parentBounds.height)}
        verticalGuidelines={getArrayGuidelines(100, parentBounds.width)}
        elementSnapDirections={true}
        snapDirections={{ top: true, right: true, bottom: true, left: true }}
        snappable
        resizable
        draggable
        onDrag={(e) => {
          updateMoveable(id, {
            top: e.top,
            left: e.left,
            width,
            height,
            color,
          });
        }}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        edge={false}
        zoom={1}
        origin={false}
        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
      />
    </>
  );
};

/**
 * Returns a random value of fit property values in css, ['fill', 'contain', 'cover', 'none', 'scale-down']
 *
 * @returns {string} - One of the fit property value string
 */
function getRandomObjectFit() {
  const options = ["fill", "contain", "cover", "none", "scale-down"];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Returns an array of numbers from 0 to 'limit', incrementing by 'step'
 *
 * @param {number} step - The number to increment by
 * @param {number} limit - The upper limit of the range of numbers to include in the array
 * @returns {number[]} - The resulting array of numbers
 */
function getArrayGuidelines(step, limit) {
  if (limit < 0) {
    return [];
  }
  let array = [];
  for (let current = 0; current <= limit; current += step) {
    array.push(current);
  }
  return array;
}
