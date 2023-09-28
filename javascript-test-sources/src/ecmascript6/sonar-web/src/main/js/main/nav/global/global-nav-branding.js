import React from 'react';

export default React.createClass({
  renderLogo() {
    let url = this.props.logoUrl || `${window.baseUrl}/images/logo.svg`,
        width = this.props.logoWidth || 100,
        height = 30,
        title = window.t('layout.sonar.slogan');
    return <img src={url} width={width} height={height} alt={title} title={title}/>;
  },

  render() {
    const homeUrl = window.baseUrl + '/';
    const homeLinkClassName = 'navbar-brand' + (this.props.logoUrl ? ' navbar-brand-custom' : '');
    return (
        <div className="navbar-header">
          <a className={homeLinkClassName} href={homeUrl}>{this.renderLogo()}</a>
        </div>
    );
  }
});
