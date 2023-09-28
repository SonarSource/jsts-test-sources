import * as React from 'react';
import { Row, Col, Typography, Card } from 'antd';
import { RightOutlined, LeftOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'bisheng/router';
import { getLocalizedPathname } from '../../utils';
import './index.less';
import Certainty from './Certainty';
import Meaningful from './Meaningful';
import Growth from './Growth';
import Natural from './Natural';
import SiteContext from '../../Layout/SiteContext';

const { Title } = Typography;

interface PanelProps {
  img: string;
  title: React.ReactNode;
  description: string;
  href?: string;
  link?: string;
}

const MINI_LIST: PanelProps[] = [
  {
    img: 'https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*ZhzDQLMyYlYAAAAAAAAAAABkARQnAQ',
    title: 'AntV',
    description: 'app.home.product-antv-slogan',
    href: 'https://antv.vision',
  },
  {
    img:
      'https://gw.alipayobjects.com/zos/antfincdn/888xda6kBc/Ant%252520Design%252520shouyepeitu.svg',
    title: 'Ant Design Pro',
    description: 'app.home.product-pro-slogan',
    href: 'https://pro.ant.design/',
  },
  {
    img: 'https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*mb-WQILTlSEAAAAAAAAAAABkARQnAQ',
    title: 'Ant Design Mobile',
    description: 'app.home.product-mobile-slogan',
    href: 'https://mobile.ant.design/',
  },
  {
    img: 'https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*PrLWSpmWZmIAAAAAAAAAAABkARQnAQ',
    title: <FormattedMessage id="app.home.product-hitu" />,
    description: 'app.home.product-hitu-slogan',
    link: '/docs/spec/illustration',
  },
  {
    img: 'https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*MaL2SYtHPuMAAAAAAAAAAABkARQnAQ',
    title: 'Kitchen',
    description: 'app.home.product-kitchen-slogan',
    href: 'https://kitchen.alipay.com/',
  },
  {
    img: 'https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*T_HeSIJ30IIAAAAAAAAAAABkARQnAQ',
    title: 'Icons',
    description: 'app.home.product-icons-slogan',
    link: '/components/icon/',
  },
];

const MiniPanel = ({
  title,
  img,
  description,
  href,
  link,
  isZhCN,
  query,
}: PanelProps & { isZhCN: boolean } & { query: object }) => {
  let content = (
    <Card
      hoverable
      className="design-mini-panel"
      cover={<img alt={typeof title === 'string' ? title : 'Hitu'} src={img} />}
    >
      <Card.Meta title={title} description={<FormattedMessage id={description} />} />
    </Card>
  );

  if (href) {
    content = (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  } else if (link) {
    content = <Link to={getLocalizedPathname(link, isZhCN, query)}>{content}</Link>;
  }

  return (
    <Col xs={24} sm={8}>
      {content}
    </Col>
  );
};

const DesignPage = (props: { location: any }) => {
  const { location } = props;
  const { locale } = useIntl();
  const isZhCN = locale === 'zh-CN';
  const { direction } = React.useContext(SiteContext);
  let IconComponent = <RightOutlined className="home-link-arrow" />;

  if (direction === 'rtl') {
    IconComponent = <LeftOutlined className="home-link-arrow home-link-arrow-rtl" />;
  }

  const smallStyle = { fontSize: 12, color: '#888', marginLeft: '0.3em' };

  return (
    <div style={{ marginBottom: -28 }}>
      {/* ***************************** Group 1 ***************************** */}
      <Row gutter={[40, 40]}>
        {/* *********************** Design Values *********************** */}
        <Col span={24}>
          <div className="design-card main-card">
            <Title level={3}>
              <FormattedMessage id="app.home.design-values" />
            </Title>

            <Row align="stretch">
              <Col xs={24} sm={8}>
                <FormattedMessage id="app.home.design-values-description" />

                <Link
                  className="design-card-detail"
                  to={getLocalizedPathname('/docs/spec/values', isZhCN, location.query)}
                >
                  <FormattedMessage id="app.home.detail" />
                  {IconComponent}
                </Link>
              </Col>
              <Col xs={24} sm={16}>
                <Row className="design-values">
                  <Col xs={12} sm={6}>
                    <img
                      alt="certainty"
                      src="https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*43rfS4dD0MUAAAAAAAAAAABkARQnAQ"
                    />
                    <Certainty />
                    <h4>
                      <FormattedMessage id="app.home.certainty" />
                    </h4>
                  </Col>
                  <Col xs={12} sm={6}>
                    <img
                      alt="meaningful"
                      src="https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*abGUQKUocSMAAAAAAAAAAABkARQnAQ"
                    />
                    <Meaningful />
                    <h4>
                      <FormattedMessage id="app.home.meaningful" />
                    </h4>
                  </Col>
                  <Col xs={12} sm={6}>
                    <img
                      alt="growth"
                      src="https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*NvhsRKmTLwUAAAAAAAAAAABkARQnAQ"
                    />
                    <Growth />
                    <h4>
                      <FormattedMessage id="app.home.growth" />
                    </h4>
                  </Col>
                  <Col xs={12} sm={6}>
                    <img
                      alt="natural"
                      src="https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*cY0tTr8q3Y4AAAAAAAAAAABkARQnAQ"
                    />
                    <Natural />
                    <h4>
                      <FormattedMessage id="app.home.natural" />
                    </h4>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>
        </Col>

        {/* *********************** Design Guides *********************** */}
        <Col xs={24} sm={12}>
          <div
            className="design-card sub-card"
            style={{
              background: '#E6F1FF',
              backgroundImage:
                'url(https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*0oaHSYRcnT4AAAAAAAAAAABkARQnAQ)',
            }}
          >
            <Row>
              <Col xs={24} sm={9} className="card-info">
                <Title level={3}>
                  <FormattedMessage id="app.home.design-guide" />
                </Title>

                <ul>
                  <li>
                    <Link to={getLocalizedPathname('/docs/spec/colors', isZhCN, location.query)}>
                      <FormattedMessage id="app.home.global-style" />
                      {IconComponent}
                    </Link>
                  </li>
                  <li>
                    <Link to={getLocalizedPathname('/docs/spec/overview', isZhCN, location.query)}>
                      <FormattedMessage id="app.home.design-patterns" />
                      {IconComponent}
                    </Link>
                  </li>
                </ul>
              </Col>
              <Col
                xs={24}
                sm={15}
                className="design-card-img-col"
                style={{ alignSelf: 'flex-end', textAlign: 'right' }}
              >
                <img
                  alt="design guide"
                  style={{ maxHeight: 278, maxWidth: '100%' }}
                  src="https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*5PRzTL4pwuYAAAAAAAAAAABkARQnAQ"
                />
              </Col>
            </Row>
          </div>
        </Col>

        {/* ************************* Component ************************* */}
        <Col xs={24} sm={12}>
          <div
            className="design-card sub-card"
            style={{
              background: '#DEF6FF',
              backgroundImage:
                'url(https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*TLJTT78n7rMAAAAAAAAAAABkARQnAQ)',
            }}
          >
            <Row>
              <Col xs={24} sm={12} className="card-info">
                <Title level={3}>
                  <FormattedMessage id="app.home.components" />
                </Title>

                <ul>
                  <li>
                    <Link
                      to={getLocalizedPathname('/docs/react/introduce', isZhCN, location.query)}
                    >
                      Ant Design of React
                    </Link>
                    <span style={smallStyle}>
                      (<FormattedMessage id="app.implementation.official" />)
                    </span>
                  </li>
                  <li>
                    <a href="https://ng.ant.design/" target="_blank" rel="noopener noreferrer">
                      Ant Design of Angular
                    </a>
                    <span style={smallStyle}>
                      (<FormattedMessage id="app.implementation.community" />)
                    </span>
                  </li>
                  <li>
                    <a href="https://antdv.com/" target="_blank" rel="noopener noreferrer">
                      Ant Design of Vue
                    </a>
                    <span style={smallStyle}>
                      (<FormattedMessage id="app.implementation.community" />)
                    </span>
                  </li>
                </ul>
              </Col>
              <Col xs={24} sm={12} style={{ alignSelf: 'flex-end', textAlign: 'right' }}>
                <img
                  alt="components"
                  className="design-card-img-col"
                  style={{ maxHeight: 278, maxWidth: '100%' }}
                  src="https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*8VDFTbQn4UAAAAAAAAAAAABkARQnAQ"
                />
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* ***************************** Group 2 ***************************** */}
      <Row
        style={{ marginTop: 40 }}
        gutter={[
          { xs: 32, sm: 40 },
          { xs: 32, sm: 40 },
        ]}
        className="design-mini-panels"
      >
        {MINI_LIST.map(panel => (
          <MiniPanel key={panel.description} {...panel} isZhCN={isZhCN} query={location.query} />
        ))}
      </Row>
    </div>
  );
};

export default DesignPage;
