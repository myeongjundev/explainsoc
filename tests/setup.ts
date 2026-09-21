import '@testing-library/jest-dom/vitest'

// jsdom은 스크롤을 구현하지 않는다. 단계 이동 때 부르는 scrollTo가 잡음을 내지 않게 한다.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
}
