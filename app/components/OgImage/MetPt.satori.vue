<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  eyebrow?: string
  accent?: string
}>()
</script>

<template>
  <div
    :style="{
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: '#f7f8f8',
      color: '#24303f',
      fontFamily: 'IBM Plex Sans',
      padding: '64px',
      borderTop: `18px solid ${accent || '#2f6fb0'}`,
    }"
  >
    <div style="display:flex; flex-direction:column;">
      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          color: accent || '#2f6fb0',
          fontSize: '30px',
          fontWeight: 700,
          marginBottom: '42px',
        }"
      >
        {{ eyebrow || 'MET·PT' }}
      </div>

      <h1
        style="
          margin: 0;
          font-size: 76px;
          line-height: 1.04;
          font-weight: 700;
          letter-spacing: 0;
          max-width: 960px;
        "
      >
        {{ title }}
      </h1>

      <p
        v-if="description"
        style="
          margin: 34px 0 0;
          color: #506070;
          font-size: 33px;
          line-height: 1.25;
          font-weight: 500;
          max-width: 960px;
        "
      >
        {{ description }}
      </p>
    </div>

    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 2px solid #dce2e8;
        padding-top: 30px;
        font-size: 28px;
        color: #6a7682;
      "
    >
      <span>Portugal weather from IPMA</span>
      <strong style="color:#24303f; font-weight:700;">MET·PT</strong>
    </div>
  </div>
</template>
