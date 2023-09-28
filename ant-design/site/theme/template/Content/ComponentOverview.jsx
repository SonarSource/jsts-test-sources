import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'bisheng/router';
import { useIntl } from 'react-intl';
import debounce from 'lodash/debounce';
import { Input, Divider, Row, Col, Card, Typography, Tag, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getChildren } from 'jsonml.js/lib/utils';
import { getMetaDescription, getLocalizedPathname, getThemeConfig, getMenuItems } from '../utils';
import './ComponentOverview.less';

const onClickCard = pathname => {
  if (window.gtag) {
    window.gtag('event', '点击', {
      event_category: '组件总览卡片',
      event_label: pathname,
    });
  }
};

const reportSearch = debounce(value => {
  if (window.gtag) {
    window.gtag('event', '搜索', {
      event_category: '组件总览卡片',
      event_label: value,
    });
  }
}, 2000);

const { Title } = Typography;
const ComponentOverview = ({
  componentsData = [],
  doc: {
    meta: { title },
    content,
  },
  location,
  utils: { toReactComponent },
}) => {
  const { locale, formatMessage } = useIntl();
  const documentTitle = `${title} - Ant Design`;
  const contentChild = getMetaDescription(getChildren(content));
  const themeConfig = getThemeConfig();
  const menuItems = getMenuItems(
    componentsData,
    locale,
    themeConfig.categoryOrder,
    themeConfig.typeOrder,
  );
  const [search, setSearch] = useState('');

  // keydown.enter goto first component
  const sectionRef = React.createRef();
  const onKeyDown = event => {
    if (event.keyCode === 13 && search.trim().length) {
      sectionRef.current?.querySelector('.components-overview-card')?.click();
    }
  };

  return (
    <section className="markdown" ref={sectionRef}>
      <Helmet encodeSpecialCharacters={false}>
        <title>{documentTitle}</title>
        <meta property="og:title" content={documentTitle} />
        {contentChild && <meta name="description" content={contentChild} />}
      </Helmet>
      <h1>{title}</h1>
      {toReactComponent(['section', { className: 'markdown' }].concat(getChildren(content)))}
      <Divider />
      <Input
        value={search}
        placeholder={formatMessage({ id: 'app.components.overview.search' })}
        className="components-overview-search"
        onChange={e => {
          setSearch(e.target.value);
          reportSearch(e.target.value);
        }}
        onKeyDown={onKeyDown}
        autoFocus // eslint-disable-line jsx-a11y/no-autofocus
        suffix={<SearchOutlined />}
      />
      <Divider />
      {menuItems
        .filter(i => i.order > -1)
        .map(group => {
          const components = group.children.filter(
            component =>
              !search.trim() ||
              component.title.toLowerCase().includes(search.trim().toLowerCase()) ||
              (component.subtitle || '').toLowerCase().includes(search.trim().toLowerCase()),
          );
          return components.length ? (
            <div key={group.title} className="components-overview">
              <Title level={2} className="components-overview-group-title">
                <Space align="center">
                  {group.title}
                  <Tag style={{ display: 'block' }}>{components.length}</Tag>
                </Space>
              </Title>
              <Row gutter={[24, 24]}>
                {components
                  .sort((a, b) => a.title.charCodeAt(0) - b.title.charCodeAt(0))
                  .map(component => {
                    const url = `${component.filename
                      .replace(/(\/index)?((\.zh-cn)|(\.en-us))?\.md$/i, '')
                      .toLowerCase()}/`;

                    // 如果是 https 就不用处理了
                    const href = url.startsWith('http')
                      ? url
                      : getLocalizedPathname(url, locale === 'zh-CN', location.query);

                    /** Link 不能跳转到外链 */
                    const ComponentLink = !url.startsWith('http') ? Link : 'a';

                    return (
                      <Col xs={24} sm={12} lg={8} xl={6} key={component.title}>
                        <ComponentLink
                          to={href}
                          href={href}
                          onClick={() => onClickCard(href.onClickCard)}
                        >
                          <Card
                            bodyStyle={{
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'bottom right',
                              backgroundImage: `url(${component.tag})`,
                            }}
                            size="small"
                            className="components-overview-card"
                            title={
                              <div className="components-overview-title">
                                {component.title} {component.subtitle}
                              </div>
                            }
                          >
                            <div className="components-overview-img">
                              <img src={component.cover} alt={component.title} />
                            </div>
                          </Card>
                        </ComponentLink>
                      </Col>
                    );
                  })}
              </Row>
            </div>
          ) : null;
        })}
    </section>
  );
};

export default ComponentOverview;
