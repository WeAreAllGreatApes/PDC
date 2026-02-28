export function getTabComponents() {
  return [
    {
      slotSelector: '[data-component-slot="tab-dispatch"]',
      path: 'src/html/tabs/dispatch-tab.html',
    },
    {
      slotSelector: '[data-component-slot="tab-alert"]',
      path: 'src/html/tabs/alert-tab.html',
    },
    {
      slotSelector: '[data-component-slot="tab-summary"]',
      path: 'src/html/tabs/summary-tab.html',
    },
    {
      slotSelector: '[data-component-slot="tab-settings"]',
      path: 'src/html/tabs/settings-tab.html',
    },
    {
      slotSelector: '[data-component-slot="tab-about"]',
      path: 'src/html/tabs/about-tab.html',
    },
  ];
}
