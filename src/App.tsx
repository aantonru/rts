import React from 'react';
import './App.css';
import { View3d, LeftBar } from './components/view3d/View3d';
import styles from '../src/components/view3d/View3d.module.css';

let displayMenu=true;

const toggleMenu=()=>{
  displayMenu=!displayMenu;
}

function App() {
  return (
    <div className="App">
        <View3d></View3d>
        <button className={ styles.menubutton } onClick={( toggleMenu )}>menu</button>
        { displayMenu && <LeftBar></LeftBar>}
    </div>
  );
}

export default App;
