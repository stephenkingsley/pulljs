import Pull from '../src/index';

Pull.init({
  // mainElement: '',
  instructionsPullToRefresh: 'Pull to Refresh',
  instructionsReleaseToRefresh: 'Release to Refresh',
  instructionsRefreshing: 'Refreshing',
  onRefresh: () => alert('hello pulljs'),
  ptrOnDesktop: true
});
