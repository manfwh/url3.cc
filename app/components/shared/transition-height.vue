<script setup lang="ts">
function onEnter (el: any, done: any) {
  el.style.height = '0'
  // eslint-disable-next-line no-unused-expressions
  el.offsetHeight // Trigger a reflow, flushing the CSS changes
  el.style.height = el.scrollHeight + 'px'

  el.addEventListener('transitionend', done, { once: true })
}

function onBeforeLeave (el: any) {
  el.style.height = el.scrollHeight + 'px'
  // eslint-disable-next-line no-unused-expressions
  el.offsetHeight // Trigger a reflow, flushing the CSS changes
}

function onAfterEnter (el: Element) {
  (el as HTMLElement).style.height = 'auto'
}

function onLeave (el: any, done: any) {
  el.style.height = '0'
  el.addEventListener('transitionend', done, { once: true })
}
</script>
<template>
  <Transition
    appear
    enter-active-class="overflow-hidden transition-[height] duration-200 ease-out"
    leave-active-class="overflow-hidden transition-[height] duration-200 ease-out"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
  >
    <slot />
  </Transition>
</template>
