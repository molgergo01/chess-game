import { Color } from '../models/game';

export function getColorString(color: Color) {
    switch (color) {
        case Color.BLACK:
            return 'black';
        case Color.WHITE:
            return 'white';
    }
}
