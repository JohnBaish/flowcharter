import { Component, type ReactNode } from 'react';

/** If a screen fails while drawing, shows a plain message and a way back to the
 *  Library instead of a blank page (house style §5). Keyed by the screen and
 *  chart in App, so moving elsewhere starts afresh. The charts themselves are
 *  saved by the store, outside this, so nothing is lost. */
export class SafetyNet extends Component<{ children: ReactNode; onLibrary: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="card safety-net" role="alert">
        <p>Sorry, this screen couldn’t be shown. Your flowcharts are still saved in this browser.</p>
        <button className="btn btn-secondary" onClick={this.props.onLibrary}>Go to the Library</button>
      </div>
    );
  }
}
