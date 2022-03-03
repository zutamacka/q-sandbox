<template>
  <q-item v-for="rep in reps" v-bind:key="rep.id">
    <q-item-section avatar>
      <q-skeleton type="QAvatar" />
    </q-item-section>

    <q-item-section>
      <q-item-label>
        <q-skeleton type="text" />
      </q-item-label>
      <q-item-label caption>
        <q-skeleton type="text" width="65%" />
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'SkeletonPost',
  props: {},
  created() {},
  data() {
    return {
      reps: [1, 2, 3, 4, 5, 6],
    }
  },
})
</script>
