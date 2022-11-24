import './custom-moon-tour.css';

const CUSTOM_CONTENT = {
  endcontent: `
<style>
  .PodysseyEndCard {
    margin: auto;
    max-width: 24rem;
    color: inherit;
    font-family: ABCSans;
    font-size: 1rem;
    text-align: center;
  }
  .PodysseyEndCard > :last-child {
    margin-bottom: 0;
  }
  .PodysseyEndCard p {
    margin: 0 auto;
    max-width: 95%;
    line-height: 1.4;
  }
  .PodysseyEndCard a {
    display: block;
    margin-top: .375rem;
    margin-bottom: 1.75rem;
    color: white;
    font-size: 0.875rem;
    font-weight: bold;
    font-weight: 600;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.125rem;
  }
  .PodysseyEndCard img {
    display: inline;
    margin: 0.25rem 0;
    width: auto;
    vertical-align: bottom;
  }
  .PodysseyEndCard div {
    display: flex;
    margin-right: -0.5rem;
    margin-left: -0.5rem;
  }
  .PodysseyEndCard div > * {
    flex-grow: 1;
    margin-right: 0.5rem;
    margin-left: 0.5rem;
  }
  @media (max-width: 360px) {
    .PodysseyEndCard {
      font-size: 0.875rem;
    }
    .PodysseyEndCard p {
      margin: 0;
      line-height: 1.2;
    }
    .PodysseyEndCard a {
      margin-bottom: 0.375rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
    .PodysseyEndCard div {
      margin-right: -0.25rem;
      margin-left: -0.25rem;
    }
    .PodysseyEndCard div > * {
      margin-right: 0.25rem;
      margin-left: 0.25rem;
    }
  }
</style>
<div class="PodysseyEndCard">
  <p>Discover more moon stories with ABC Science</p>
  <a target="_blank" href="//www.abc.net.au/news/science/">
    <img alt="ABC Open" style="width:100%" src="data:image/png;base64,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" />
  </a>
</div>
  `
};

window.addEventListener('podyssey:custom', ({ detail }) => {
  const { id, el } = detail;

  const html = CUSTOM_CONTENT[id];

  if (html) {
    el.innerHTML = html;
  }
});
