import { SearchOutlined } from '@ant-design/icons';
import { mount } from 'enzyme';
import { resetWarned } from 'rc-util/lib/warning';
import React, { Component } from 'react';
import { act } from 'react-dom/test-utils';
import Button from '..';
import mountTest from '../../../tests/shared/mountTest';
import rtlTest from '../../../tests/shared/rtlTest';
import { fireEvent, render, sleep } from '../../../tests/utils';
import ConfigProvider from '../../config-provider';
import type { SizeType } from '../../config-provider/SizeContext';

describe('Button', () => {
  mountTest(Button);
  mountTest(() => <Button size="large" />);
  mountTest(() => <Button size="small" />);
  mountTest(Button.Group);
  mountTest(() => <Button.Group size="large" />);
  mountTest(() => <Button.Group size="small" />);
  mountTest(() => <Button.Group size="middle" />);

  rtlTest(Button);
  rtlTest(() => <Button size="large" />);
  rtlTest(() => <Button size="small" />);
  rtlTest(Button.Group);
  rtlTest(() => <Button.Group size="large" />);
  rtlTest(() => <Button.Group size="small" />);
  rtlTest(() => <Button.Group size="middle" />);

  it('renders correctly', () => {
    const { container } = render(<Button>Follow</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('mount correctly', () => {
    expect(() => render(<Button>Follow</Button>)).not.toThrow();
  });

  it('warns if size is wrong', () => {
    resetWarned();
    const mockWarn = jest.spyOn(console, 'error').mockImplementation(() => {});
    const size = 'who am I' as any as SizeType;
    render(<Button.Group size={size} />);
    expect(mockWarn).toHaveBeenCalledWith('Warning: [antd: Button.Group] Invalid prop `size`.');

    mockWarn.mockRestore();
  });

  it('renders Chinese characters correctly', () => {
    expect(render(<Button>按钮</Button>).container.firstChild).toMatchSnapshot();
    // should not insert space when there is icon
    expect(
      render(<Button icon={<SearchOutlined />}>按钮</Button>).container.firstChild,
    ).toMatchSnapshot();
    // should not insert space when there is icon
    expect(
      render(
        <Button>
          <SearchOutlined />
          按钮
        </Button>,
      ).container.firstChild,
    ).toMatchSnapshot();
    // should not insert space when there is icon
    expect(
      render(<Button icon={<SearchOutlined />}>按钮</Button>).container.firstChild,
    ).toMatchSnapshot();
    // should not insert space when there is icon while loading
    expect(
      render(
        <Button icon={<SearchOutlined />} loading>
          按钮
        </Button>,
      ).container.firstChild,
    ).toMatchSnapshot();
    // should insert space while loading
    expect(render(<Button loading>按钮</Button>).container.firstChild).toMatchSnapshot();

    // should insert space while only one nested element
    expect(
      render(
        <Button>
          <span>按钮</span>
        </Button>,
      ).container.firstChild,
    ).toMatchSnapshot();
  });

  it('renders Chinese characters correctly in HOC', () => {
    const Text = ({ children }: { children: React.ReactNode }) => <span>{children}</span>;
    const { container, rerender } = render(
      <Button>
        <Text>按钮</Text>
      </Button>,
    );
    expect(container.querySelector('.ant-btn')).toHaveClass('ant-btn-two-chinese-chars');

    rerender(
      <Button>
        <Text>大按钮</Text>
      </Button>,
    );
    expect(container.querySelector('.ant-btn')).not.toHaveClass('ant-btn-two-chinese-chars');

    rerender(
      <Button>
        <Text>按钮</Text>
      </Button>,
    );
    expect(container.querySelector('.ant-btn')).toHaveClass('ant-btn-two-chinese-chars');
  });

  // https://github.com/ant-design/ant-design/issues/18118
  it('should not insert space to link or text button', () => {
    const wrapper1 = render(<Button type="link">按钮</Button>);
    expect(wrapper1.getByRole('button')).toHaveTextContent('按钮');
    wrapper1.unmount();
    const wrapper2 = render(<Button type="text">按钮</Button>);
    expect(wrapper2.getByRole('button')).toHaveTextContent('按钮');
  });

  it('should render empty button without errors', () => {
    const wrapper = render(
      <Button>
        {null}
        {undefined}
      </Button>,
    );
    expect(wrapper.container.firstChild).toMatchSnapshot();
  });

  it('have static property for type detecting', () => {
    const wrapper = mount(<Button>Button Text</Button>);
    expect((wrapper.find(Button).type() as any).__ANT_BUTTON).toBe(true);
  });

  it('should change loading state instantly by default', () => {
    class DefaultButton extends Component {
      state = {
        loading: false,
      };

      enterLoading = () => {
        this.setState({ loading: true });
      };

      render() {
        const { loading } = this.state;
        return (
          <Button loading={loading} onClick={this.enterLoading}>
            Button
          </Button>
        );
      }
    }
    const wrapper = render(<DefaultButton />);
    fireEvent.click(wrapper.container.firstChild!);
    expect(wrapper.container.querySelectorAll('.ant-btn-loading').length).toBe(1);
  });

  it('should change loading state with delay', () => {
    class DefaultButton extends Component {
      state = {
        loading: false,
      };

      enterLoading = () => {
        this.setState({ loading: { delay: 1000 } });
      };

      render() {
        const { loading } = this.state;
        return (
          <Button loading={loading} onClick={this.enterLoading}>
            Button
          </Button>
        );
      }
    }
    const wrapper = render(<DefaultButton />);
    fireEvent.click(wrapper.container.firstChild!);
    expect(wrapper.container.firstChild).not.toHaveClass('ant-btn-loading');
  });

  it('reset when loading back of delay', () => {
    jest.useFakeTimers();
    const { rerender, container } = render(<Button loading={{ delay: 1000 }} />);
    rerender(<Button loading={{ delay: 2000 }} />);
    rerender(<Button loading={false} />);

    act(() => {
      jest.runAllTimers();
    });

    expect(container.querySelectorAll('.ant-btn-loading')).toHaveLength(0);

    jest.useRealTimers();
  });

  it('should not clickable when button is loading', () => {
    const onClick = jest.fn();
    const { container } = render(
      <Button loading onClick={onClick}>
        button
      </Button>,
    );
    fireEvent.click(container.firstChild!);
    expect(onClick).not.toHaveBeenCalledWith();
  });

  it('should support link button', () => {
    const wrapper = render(
      <Button target="_blank" href="https://ant.design">
        link button
      </Button>,
    );
    expect(wrapper.container.firstChild).toMatchSnapshot();
  });

  it('fixbug renders {0} , 0 and {false}', () => {
    expect(render(<Button>{0}</Button>).container.firstChild).toMatchSnapshot();
    expect(render(<Button>0</Button>).container.firstChild).toMatchSnapshot();
    expect(render(<Button>{false}</Button>).container.firstChild).toMatchSnapshot();
  });

  it('should not render as link button when href is undefined', async () => {
    const wrapper = render(
      <Button type="primary" href={undefined}>
        button
      </Button>,
    );
    expect(wrapper.container.firstChild).toMatchSnapshot();
  });

  // // https://github.com/ant-design/ant-design/issues/15342
  it('should merge text if children using variable', () => {
    const wrapper = render(
      <Button>
        {/* eslint-disable-next-line react/jsx-curly-brace-presence */}
        This {'is'} a test {1}
      </Button>,
    );
    expect(wrapper.container.firstChild).toMatchSnapshot();
  });

  it('should support to change loading', async () => {
    const { rerender, container, unmount } = render(<Button>Button</Button>);
    rerender(<Button loading />);
    expect(container.querySelectorAll('.ant-btn-loading').length).toBe(1);
    rerender(<Button loading={false} />);
    expect(container.querySelectorAll('.ant-btn-loading').length).toBe(0);
    rerender(<Button loading={{ delay: 50 }} />);
    expect(container.querySelectorAll('.ant-btn-loading').length).toBe(0);
    await sleep(50);
    expect(container.querySelectorAll('.ant-btn-loading').length).toBe(1);
    rerender(<Button loading={false} />);
    await sleep(50);
    expect(container.querySelectorAll('.ant-btn-loading').length).toBe(0);
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('should warning when pass a string as icon props', () => {
    resetWarned();
    const warnSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Button type="primary" icon="ab" />);
    expect(warnSpy).not.toHaveBeenCalled();

    render(<Button type="primary" icon="search" />);
    expect(warnSpy).toHaveBeenCalledWith(
      `Warning: [antd: Button] \`icon\` is using ReactNode instead of string naming in v4. Please check \`search\` at https://ant.design/components/icon`,
    );

    warnSpy.mockRestore();
  });

  it('should warning when pass type=link and ghost=true', () => {
    resetWarned();
    const warnSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<Button type="link" ghost />);
    expect(warnSpy).toHaveBeenCalledWith(
      "Warning: [antd: Button] `link` or `text` button can't be a `ghost` button.",
    );
    warnSpy.mockRestore();
  });

  it('should warning when pass type=text and ghost=true', () => {
    resetWarned();
    const warnSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<Button type="text" ghost />);
    expect(warnSpy).toHaveBeenCalledWith(
      "Warning: [antd: Button] `link` or `text` button can't be a `ghost` button.",
    );
    warnSpy.mockRestore();
  });

  it('skip check 2 words when ConfigProvider disable this', () => {
    let buttonInstance: any;
    render(
      <ConfigProvider autoInsertSpaceInButton={false}>
        <Button
          ref={node => {
            buttonInstance = node;
          }}
        >
          test
        </Button>
      </ConfigProvider>,
    );

    Object.defineProperty(buttonInstance, 'textContent', {
      get() {
        throw new Error('Should not called!!!');
      },
    });
  });

  it('should not redirect when button is disabled', () => {
    const onClick = jest.fn();
    const { container } = render(
      <Button href="https://ant.design" onClick={onClick} disabled>
        click me
      </Button>,
    );
    fireEvent.click(container.firstChild!);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should match class .ant-btn-disabled when button is disabled and href is not undefined', () => {
    const wrapper = render(
      <Button href="https://ant.design" disabled>
        click me
      </Button>,
    );
    expect(wrapper.container.querySelector('.ant-btn')).toHaveClass('ant-btn-disabled');
  });

  // https://github.com/ant-design/ant-design/issues/30953
  it('should handle fragment as children', () => {
    const wrapper = render(
      <Button>
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <>text</>
      </Button>,
    );
    expect(wrapper.container.firstChild).toMatchSnapshot();
  });
});
