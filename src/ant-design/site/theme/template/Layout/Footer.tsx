import React from 'react';
import { message } from 'antd';
import RcFooter from 'rc-footer';
import { Link } from 'bisheng/router';
import { presetPalettes } from '@ant-design/colors';
import type { WrappedComponentProps } from 'react-intl';
import { FormattedMessage, injectIntl } from 'react-intl';
import {
  AntDesignOutlined,
  MediumOutlined,
  TwitterOutlined,
  ZhihuOutlined,
  UsergroupAddOutlined,
  GithubOutlined,
  HistoryOutlined,
  ProfileOutlined,
  BugOutlined,
  IssuesCloseOutlined,
  QuestionCircleOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import ColorPicker from '../Color/ColorPicker';
import { loadScript, getLocalizedPathname } from '../utils';

class Footer extends React.Component<WrappedComponentProps & { location: any }> {
  lessLoaded = false;

  state = {
    color: presetPalettes.blue.primary,
  };

  getColumns() {
    const { intl, location } = this.props;

    const isZhCN = intl.locale === 'zh-CN';

    const getLinkHash = (path: string, hash: { zhCN: string; enUS: string }) => {
      const pathName = getLocalizedPathname(path, isZhCN, location.query, hash);
      const { pathname, query = {} } = pathName;
      const pathnames = pathname.split('#');
      if ('direction' in query) {
        return `${pathnames[0]}?direction=rtl#${pathnames[1]}`;
      }
      return pathname;
    };

    const getLink = (path: string) => {
      const pathName = getLocalizedPathname(path, isZhCN, location.query);
      const { pathname, query = {} } = pathName;
      if ('direction' in query) {
        return `${pathname}?direction=rtl}`;
      }
      return pathname;
    };

    const col1 = {
      title: <FormattedMessage id="app.footer.resources" />,
      items: [
        {
          title: 'Ant Design Charts',
          url: 'https://charts.ant.design',
          openExternal: true,
        },
        {
          title: 'Ant Design Pro',
          url: 'https://pro.ant.design',
          openExternal: true,
        },
        {
          title: 'Ant Design Pro Components',
          url: 'https://procomponents.ant.design',
          openExternal: true,
        },
        {
          title: 'Ant Design Mobile',
          url: 'https://mobile.ant.design',
          openExternal: true,
        },
        {
          title: 'Ant Design Landing',
          description: <FormattedMessage id="app.footer.landing" />,
          url: 'https://landing.ant.design',
          openExternal: true,
        },
        {
          title: 'Scaffolds',
          description: <FormattedMessage id="app.footer.scaffolds" />,
          url: 'https://scaffold.ant.design',
          openExternal: true,
        },
        {
          title: 'Umi',
          description: <FormattedMessage id="app.footer.umi" />,
          url: 'https://umijs.org',
          openExternal: true,
        },
        {
          title: 'Dumi',
          description: <FormattedMessage id="app.footer.dumi" />,
          url: 'https://d.umijs.org',
          openExternal: true,
        },
        {
          title: 'qiankun',
          description: <FormattedMessage id="app.footer.qiankun" />,
          url: 'https://qiankun.umijs.org',
          openExternal: true,
        },
        {
          title: 'ahooks',
          description: <FormattedMessage id="app.footer.hooks" />,
          url: 'https://github.com/alibaba/hooks',
          openExternal: true,
        },
        {
          title: 'Ant Motion',
          description: <FormattedMessage id="app.footer.motion" />,
          url: 'https://motion.ant.design',
          openExternal: true,
        },
        {
          title: <FormattedMessage id="app.footer.chinamirror" />,
          url: 'https://ant-design.gitee.io/',
        },
      ],
    };

    const col2 = {
      title: <FormattedMessage id="app.footer.community" />,
      items: [
        {
          icon: <AntDesignOutlined />,
          title: <FormattedMessage id="app.footer.awesome" />,
          url: 'https://github.com/websemantics/awesome-ant-design',
          openExternal: true,
        },
        {
          icon: <MediumOutlined />,
          title: 'Medium',
          url: 'http://medium.com/ant-design/',
          openExternal: true,
        },
        {
          icon: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
          title: 'Twitter',
          url: 'http://twitter.com/antdesignui',
          openExternal: true,
        },
        {
          icon: <ZhihuOutlined style={{ color: '#0084ff' }} />,
          title: <FormattedMessage id="app.footer.zhihu" />,
          url: 'http://zhuanlan.zhihu.com/antdesign',
          openExternal: true,
        },
        {
          icon: <ZhihuOutlined style={{ color: '#0084ff' }} />,
          title: <FormattedMessage id="app.footer.zhihu.xtech" />,
          url: 'http://zhuanlan.zhihu.com/xtech',
          openExternal: true,
        },
        {
          icon: (
            <img
              src="https://gw.alipayobjects.com/zos/rmsportal/mZBWtboYbnMkTBaRIuWQ.png"
              alt="seeconf"
            />
          ),
          title: 'SEE Conf',
          description: <FormattedMessage id="app.footer.seeconf" />,
          url: 'https://seeconf.antfin.com/',
          openExternal: true,
        },
      ],
    };

    if (isZhCN) {
      col2.items.push({
        icon: <UsergroupAddOutlined />,
        title: <FormattedMessage id="app.footer.work_with_us" />,
        url: getLinkHash('/docs/resources', {
          zhCN: '加入我们',
          enUS: 'JoinUs',
        }),
        LinkComponent: Link,
      } as any);
    }

    const col3 = {
      title: <FormattedMessage id="app.footer.help" />,
      items: [
        {
          icon: <GithubOutlined />,
          title: 'GitHub',
          url: 'https://github.com/ant-design/ant-design',
          openExternal: true,
        },
        {
          icon: <HistoryOutlined />,
          title: <FormattedMessage id="app.footer.change-log" />,
          url: getLink('/changelog'),
          LinkComponent: Link,
        },
        {
          icon: <ProfileOutlined />,
          title: <FormattedMessage id="app.footer.faq" />,
          url: getLink('/docs/react/faq'),
          LinkComponent: Link,
        },
        {
          icon: <BugOutlined />,
          title: <FormattedMessage id="app.footer.bug-report" />,
          url: 'https://new-issue.ant.design/',
          openExternal: true,
        },
        {
          icon: <IssuesCloseOutlined />,
          title: <FormattedMessage id="app.footer.issues" />,
          url: 'https://github.com/ant-design/ant-design/issues',
          openExternal: true,
        },
        {
          icon: <QuestionCircleOutlined />,
          title: <FormattedMessage id="app.footer.discussions" />,
          url: 'https://github.com/ant-design/ant-design/discussions',
          openExternal: true,
        },
        {
          icon: <QuestionCircleOutlined />,
          title: <FormattedMessage id="app.footer.stackoverflow" />,
          url: 'http://stackoverflow.com/questions/tagged/antd',
          openExternal: true,
        },
        {
          icon: <QuestionCircleOutlined />,
          title: <FormattedMessage id="app.footer.segmentfault" />,
          url: 'https://segmentfault.com/t/antd',
          openExternal: true,
        },
      ],
    };

    const col4 = {
      icon: (
        <img
          src="https://gw.alipayobjects.com/zos/rmsportal/nBVXkrFdWHxbZlmMbsaH.svg"
          alt="Ant XTech"
        />
      ),
      title: <FormattedMessage id="app.footer.more-product" />,
      items: [
        {
          icon: (
            <img
              src="https://gw.alipayobjects.com/zos/rmsportal/XuVpGqBFxXplzvLjJBZB.svg"
              alt="yuque"
            />
          ),
          title: <FormattedMessage id="app.footer.yuque" />,
          url: 'https://yuque.com',
          description: <FormattedMessage id="app.footer.yuque.slogan" />,
          openExternal: true,
        },
        {
          icon: (
            <img
              src="https://gw.alipayobjects.com/zos/antfincdn/nc7Fc0XBg5/8a6844f5-a6ed-4630-9177-4fa5d0b7dd47.png"
              alt="AntV"
            />
          ),
          title: 'AntV',
          url: 'https://antv.vision',
          description: <FormattedMessage id="app.footer.antv.slogan" />,
          openExternal: true,
        },
        {
          icon: (
            <img
              src="https://gw.alipayobjects.com/zos/antfincdn/v2%24rh7lqpu/82f338dd-b0a6-41bc-9a86-58aaa9df217b.png"
              alt="Egg"
            />
          ),
          title: 'Egg',
          url: 'https://eggjs.org',
          description: <FormattedMessage id="app.footer.egg.slogan" />,
          openExternal: true,
        },
        {
          icon: (
            <img
              src="https://gw.alipayobjects.com/zos/rmsportal/DMDOlAUhmktLyEODCMBR.ico"
              alt="kitchen"
            />
          ),
          title: 'Kitchen',
          description: <FormattedMessage id="app.footer.kitchen" />,
          url: 'https://kitchen.alipay.com',
          openExternal: true,
        },
        {
          icon: (
            <img
              src="https://gw.alipayobjects.com/zos/rmsportal/nBVXkrFdWHxbZlmMbsaH.svg"
              alt="xtech"
            />
          ),
          title: <FormattedMessage id="app.footer.xtech" />,
          url: 'https://xtech.antfin.com/',
          openExternal: true,
        },
        {
          icon: <BgColorsOutlined />,
          title: <FormattedMessage id="app.footer.theme" />,
          url: getLinkHash('/components/config-provider/', {
            zhCN: 'components-config-provider-demo-theme',
            enUS: 'components-config-provider-demo-theme',
          }),
          LinkComponent: Link,
        },
      ],
    };

    return [col1, col2, col3, col4];
  }

  handleColorChange = (color: string) => {
    const {
      intl: { messages },
    } = this.props;
    message.loading({
      content: messages['app.footer.primary-color-changing'],
      key: 'change-primary-color',
    });
    const changeColor = () => {
      (window as any).less
        .modifyVars({
          '@primary-color': color,
        })
        .then(() => {
          message.success({
            content: messages['app.footer.primary-color-changed'],
            key: 'change-primary-color',
          });
          this.setState({ color });
        });
    };

    const lessUrl = 'https://gw.alipayobjects.com/os/lib/less/3.10.3/dist/less.min.js';

    if (this.lessLoaded) {
      changeColor();
    } else {
      (window as any).less = {
        async: true,
        javascriptEnabled: true,
      };
      loadScript(lessUrl).then(() => {
        this.lessLoaded = true;
        changeColor();
      });
    }
  };

  renderThemeChanger() {
    const { color } = this.state;
    const colors = Object.keys(presetPalettes).filter(item => item !== 'grey');
    return (
      <ColorPicker
        small
        color={color}
        position="top"
        presetColors={[
          ...colors.map(c => presetPalettes[c][5]),
          ...colors.map(c => presetPalettes[c][4]),
          ...colors.map(c => presetPalettes[c][6]),
        ]}
        onChangeComplete={this.handleColorChange}
      />
    );
  }

  render() {
    return (
      <RcFooter
        columns={this.getColumns()}
        bottom={
          <>
            Made with <span style={{ color: '#fff' }}>❤</span> by
            {/* eslint-disable-next-line react/jsx-curly-brace-presence */}{' '}
            <a target="_blank" rel="noopener noreferrer" href="https://xtech.antfin.com">
              <FormattedMessage id="app.footer.company" />
            </a>
          </>
        }
      />
    );
  }
}

export default injectIntl(Footer);
