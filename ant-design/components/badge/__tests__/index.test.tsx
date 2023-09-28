import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import mountTest from '../../../tests/shared/mountTest';
import rtlTest from '../../../tests/shared/rtlTest';
import Tooltip from '../../tooltip';
import Badge from '../index';

describe('Badge', () => {
  mountTest(Badge);
  rtlTest(Badge);
  rtlTest(() => (
    <Badge count={5} offset={[10, 10]}>
      <a href="#" className="head-example">
        head
      </a>
    </Badge>
  ));

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('badge dot not scaling count > 9', () => {
    const { container } = render(<Badge count={10} dot />);
    expect(container.querySelectorAll('.ant-card-multiple-words').length).toBe(0);
  });

  it('badge should support float number', () => {
    const { container } = render(<Badge count={3.5} />);
    expect(container.querySelectorAll('.ant-badge-multiple-words')[0].textContent).toEqual('3.5');

    const { container: anotherContainer, unmount } = render(<Badge count="3.5" />);
    expect(anotherContainer.querySelectorAll('.ant-badge-multiple-words')[0].textContent).toEqual(
      '3.5',
    );

    expect(() => unmount()).not.toThrow();
  });

  it('badge dot not showing count == 0', () => {
    const { container } = render(<Badge count={0} dot />);
    expect(container.querySelectorAll('.ant-badge-dot').length).toBe(0);
  });

  it('should have an overriden title attribute', () => {
    const { container } = render(<Badge count={10} title="Custom title" />);
    expect((container.querySelector('.ant-scroll-number')! as HTMLElement).title).toEqual(
      'Custom title',
    );
  });

  // https://github.com/ant-design/ant-design/issues/10626
  it('should be composable with Tooltip', () => {
    const ref = React.createRef<typeof Tooltip>();
    const { container } = render(
      <Tooltip title="Fix the error" ref={ref}>
        <Badge status="error" />
      </Tooltip>,
    );

    act(() => {
      fireEvent.mouseEnter(container.querySelector('.ant-badge')!);
      jest.runAllTimers();
    });
    expect((container.firstChild! as HTMLElement).classList).toContain('ant-tooltip-open');
  });

  it('should render when count is changed', () => {
    const { asFragment, rerender } = render(<Badge count={9} />);

    function updateMatch(count: number) {
      rerender(<Badge count={count} />);

      act(() => {
        jest.runAllTimers();
        expect(asFragment().firstChild).toMatchSnapshot();
      });
    }

    updateMatch(10);
    updateMatch(11);
    updateMatch(11);
    updateMatch(111);
    updateMatch(10);
    updateMatch(9);
  });

  it('should be compatible with borderColor style', () => {
    const { asFragment } = render(
      <Badge
        count={4}
        style={{ backgroundColor: '#fff', color: '#999', borderColor: '#d9d9d9' }}
      />,
    );
    expect(asFragment().firstChild).toMatchSnapshot();
  });

  // https://github.com/ant-design/ant-design/issues/13694
  it('should support offset when count is a ReactNode', () => {
    const { asFragment } = render(
      <Badge count={<span className="custom" style={{ color: '#f5222d' }} />} offset={[10, 20]}>
        <a href="#" className="head-example">
          head
        </a>
      </Badge>,
    );
    expect(asFragment().firstChild).toMatchSnapshot();
  });

  // https://github.com/ant-design/ant-design/issues/15349
  it('should color style  works on Badge', () => {
    const { container } = render(
      <Badge style={{ color: 'red' }} status="success" text="Success" />,
    );
    expect((container.querySelector('.ant-badge-status-text')! as HTMLElement).style.color).toEqual(
      'red',
    );
  });

  // https://github.com/ant-design/ant-design/issues/15799
  it('render correct with negative number', () => {
    const { asFragment } = render(
      <div>
        <Badge count="-10" />
        <Badge count={-10} />
      </div>,
    );
    expect(asFragment().firstChild).toMatchSnapshot();
  });

  // https://github.com/ant-design/ant-design/issues/21331
  // https://github.com/ant-design/ant-design/issues/31590
  it('render Badge status/color when contains children', () => {
    const { container, asFragment } = render(
      <div>
        <Badge count={5} status="success">
          <a />
        </Badge>
        <Badge count={5} color="blue">
          <a />
        </Badge>
        <Badge count={5} color="#08c">
          <a />
        </Badge>
      </div>,
    );
    expect(asFragment().firstChild).toMatchSnapshot();
    expect(container.querySelectorAll('.ant-scroll-number-only-unit')[0].textContent).toBe('5');
    expect(container.querySelectorAll('.ant-scroll-number-only-unit')[1].textContent).toBe('5');
    expect(container.querySelectorAll('.ant-scroll-number-only-unit')[2].textContent).toBe('5');
  });

  it('Badge should work when status/color is empty string', () => {
    const { container } = render(
      <>
        <Badge color="" text="text" />
        <Badge status={'' as any} text="text" />
      </>,
    );

    expect(container.querySelectorAll('.ant-badge')).toHaveLength(2);
  });
});
