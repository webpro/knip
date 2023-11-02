<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';

const child1 = defineAsyncComponent(() => import('./child1.vue'));

export default defineComponent({
  components: {
    child1,
    child2: defineAsyncComponent(() => import('./child2.vue')),
  },
});
</script>

<script>
function showDialog(componentImport) {
  Dialog.create({
    component: defineAsyncComponent(componentImport),
  });
}

showDialog(() => import('./child3.vue'));
showDialog(defineAsyncComponent(() => import('./child3.vue')));
</script>

<template>
  <child1></child1>
  <child2></child2>
</template>
