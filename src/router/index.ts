import { createRouter, createWebHistory } from 'vue-router';
import Welcome from '@/pages/Welcome.vue';
import AntiTetris from '@/pages/AntiTetris.vue';
import BinaryMaze from '@/pages/BinaryMaze.vue';
import Settings from '@/pages/Settings.vue';

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: Welcome,
  },
  {
    path: '/anti-tetris',
    name: 'AntiTetris',
    component: AntiTetris,
  },
  {
    path: '/binary-maze',
    name: 'BinaryMaze',
    component: BinaryMaze,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
