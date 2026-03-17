export interface SkinDefinition {
  id: string;
  name: string;
  cost: number;
  bodyColor: string;
  headColor: string;
  glowColor: string;
  particleColor: string;
}

export const SKIN_DEFS: SkinDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    cost: 0,
    bodyColor: '#00ff41',
    headColor: '#39ff14',
    glowColor: '#00ff41',
    particleColor: '#00ff41',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    cost: 50,
    bodyColor: '#ff1744',
    headColor: '#ff5252',
    glowColor: '#ff1744',
    particleColor: '#ff1744',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    cost: 100,
    bodyColor: '#00e5ff',
    headColor: '#18ffff',
    glowColor: '#00e5ff',
    particleColor: '#00e5ff',
  },
  {
    id: 'solar',
    name: 'Solar',
    cost: 150,
    bodyColor: '#ffab00',
    headColor: '#ffd740',
    glowColor: '#ffab00',
    particleColor: '#ffab00',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    cost: 200,
    bodyColor: '#b388ff',
    headColor: '#d1c4e9',
    glowColor: '#b388ff',
    particleColor: '#b388ff',
  },
  {
    id: 'toxic',
    name: 'Toxic',
    cost: 250,
    bodyColor: '#76ff03',
    headColor: '#ccff90',
    glowColor: '#76ff03',
    particleColor: '#76ff03',
  },
  {
    id: 'ember',
    name: 'Ember',
    cost: 350,
    bodyColor: '#ff6d00',
    headColor: '#ff9e40',
    glowColor: '#ff6d00',
    particleColor: '#ff6d00',
  },
  {
    id: 'void',
    name: 'Void',
    cost: 500,
    bodyColor: '#6200ea',
    headColor: '#7c4dff',
    glowColor: '#6200ea',
    particleColor: '#6200ea',
  },
];
