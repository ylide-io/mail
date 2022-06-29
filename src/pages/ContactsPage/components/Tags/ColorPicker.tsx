import React from 'react';
import {colors} from "../../../../utils/colors";

interface ColorPickerProps {
    color: colors
    active?: boolean
    onClick: (color: colors) => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({color, active, onClick}) => {

    const styles = () => {
        let styles: React.CSSProperties = {
            width: 22,
            height: 22,
            borderRadius: 25,
            margin: "0 4px",
        }

        if(!active) {
            styles = {
                ...styles,
                opacity: 0.8,
                cursor: "pointer"
            }
        }

        return styles
    }

    return (
        <div onClick={() => onClick(color)} style={!active ? {opacity: 0.8} : {}}>
            <div style={styles()} className={`label-${color}`}/>
        </div>
    );
};

export default ColorPicker;
