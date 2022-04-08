import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Swiper, SwipeAction, Dialog } from 'antd-mobile';
import { Tooltip } from 'antd';
import { SwiperRef } from 'antd-mobile/es/components/swiper';
import cx from 'classnames';
import editIcon from './images/schedule-edit.png';
import deleteIcon from './images/schedule-delete.png';
import { DailyScheduleProps } from './types';
import TimelineScale from './TimelineScale';

import './index.scss';

const weekCNArr = ['日', '一', '二', '三', '四', '五', '六'];
const oneDay = 60 * 60 * 1000 * 24;
const now = new Date();
const nowTime = now.getTime();

function fixZero(num: number | string): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function formatDate(timestamp: number) {
  const time = new Date(timestamp);
  const week = time.getDay();
  const month = time.getMonth() + 1;
  const date = time.getDate();

  return {
    timestamp,
    weekCN: weekCNArr[week],
    week,
    month: month < 10 ? `0${month}` : month.toString(),
    date: date < 10 ? `0${date}` : date.toString(),
  };
}

// 数组分页
function datePagination(dateList: number[], size = 7) {
  const rtn: number[][] = [];

  for (let i = 0; i < size; i++) {
    rtn.push((dateList || []).slice(size * i, size * (i + 1)));
  }

  return rtn;
}

// 前两周，后四周
function createDateList(fromTime: number) {
  const dateList = [fromTime];
  const weekTemp = now.getDay();
  const week = weekTemp === 0 ? 7 : weekTemp;

  for (let i = 0; i < 14 + week - 1; i++) {
    const calcDate = dateList[0];
    dateList.unshift(calcDate - oneDay);
  }

  for (let i = 0; i < 28 + (7 - week); i++) {
    const calcDate = dateList[dateList.length - 1];
    dateList.push(calcDate + oneDay);
  }

  return datePagination(dateList);
}

function toMinus(timestamp: number): number {
  return parseInt((timestamp / 1000 / 60).toString(), 10);
}

function calcTop(targetTimestamp: number, offset = 32): number {
  const currDate = new Date(targetTimestamp);
  const targetMinus = toMinus(targetTimestamp);
  const limitTime = toMinus(currDate.setHours(21, 59, 59));
  const begin = toMinus(currDate.setHours(7, 0, 0));
  const heightPerMinu = 72 / 60;
  const passTime = Math.min(limitTime, targetMinus) - begin;
  const top = parseInt((heightPerMinu * passTime).toString(), 10) + offset;

  return top;
}

function parseTime(
  timestamp: number,
): {
  month: number;
  date: number;
  hours: number;
  mins: number;
  seconds: number;
} {
  const time = new Date(timestamp);
  return {
    month: time.getMonth() + 1,
    date: time.getDate(),
    hours: time.getHours(),
    mins: time.getMinutes(),
    seconds: time.getSeconds(),
  };
}

// 获取指定日期的开始时间
function getDateStartTime(timestamp: number) {
  return Math.floor(new Date(Number(timestamp)).setHours(0, 0, 0) / 1000);
}

const dateList = createDateList(nowTime);

const DailySchedule: React.FC<DailyScheduleProps> = (props) => {
  const [selectDate, setSelectDate] = useState<number>(props.initDate || Date.now());
  // Lock for Swiper component trigger onIndexChange event.
  const [isGoTodayFlag, setGoTodayFlag] = useState(false);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<SwiperRef>(null);
  const { scheduleData } = props;

  const selectDateHandler = useCallback(
    (event: React.SyntheticEvent<HTMLElement>) => {
      const dateTimestamp = Number(event.currentTarget.dataset.timestamp);
      setSelectDate(dateTimestamp);
      if (props.onSelectDate) {
        props.onSelectDate(dateTimestamp);
      }
    },
    [props],
  );

  const goToday = useCallback(() => {
    setGoTodayFlag(true);
    swipeRef.current?.swipeTo(2);
    setSelectDate(nowTime);
    if (props.onSelectDate) {
      props.onSelectDate(nowTime);
    }
    setTimeout(() => {
      setGoTodayFlag(false);
    }, 500);
  }, [props]);

  const add = useCallback(() => {
    if (props.onAdd) {
      props.onAdd();
    }
  }, [props]);

  const edit = useCallback(
    (event: React.SyntheticEvent<HTMLElement>) => {
      const id = Number(event.currentTarget.dataset.id);
      event.stopPropagation();

      if (props.onEdit) {
        props.onEdit(id);
      }
    },
    [props],
  );

  const clickItem = useCallback(
    (event: React.SyntheticEvent<HTMLElement>) => {
      const id = Number(event.currentTarget.dataset.id);
      if (props.onScheduleItemClick) {
        props.onScheduleItemClick(id);
      }
    },
    [props],
  );

  const del = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>) => {
      const deleteBtn = event.currentTarget.querySelector('.delete-btn') as HTMLElement;

      if (deleteBtn) {
        const id = Number(deleteBtn.dataset?.id);
        event.stopPropagation();

        Dialog.confirm({
          title: '删除课程',
          content: '确定要删除此课程吗？',
          confirmText: <div className="dialog-confirm-text">删除</div>,
          cancelText: <div className="dialog-cancel-text">取消</div>,
          onConfirm: async () => {
            if (props.onDelete) {
              props.onDelete(id);
            }
          },
          className: 'schedule-dialog',
        });
      }

    },
    [props],
  );

  const swiperChange = useCallback(
    (index: number) => {
      if (!isGoTodayFlag) {
        const weekFirstDateTimeStamp = dateList[index][0];
        setSelectDate(weekFirstDateTimeStamp);
        props.onSelectDate(weekFirstDateTimeStamp);
      }
    },
    [setSelectDate, isGoTodayFlag, props],
  );

  // 设置当前时间线位置
  useEffect(() => {
    const currDate = new Date();
    const top = calcTop(currDate.getTime());
    const passHours = currDate.getHours() - 7 + 1;

    if (currentLineRef.current) {
      currentLineRef.current.style.top = `${top + passHours}px`;
    }
  }, [selectDate]);

  const selectDateStart = getDateStartTime(selectDate);
  const todayStart = getDateStartTime(nowTime);
  const isSelectToday = selectDateStart === todayStart;
  const isSelectBeforeToday = selectDateStart < todayStart;

  return (
    <div className="daily-schedule">
      <div className="name">{props.title}</div>
      <div className="date-list">
        <Swiper ref={swipeRef} defaultIndex={2} onIndexChange={swiperChange}>
          {dateList.map((dateItem) => {
            return (
              // @ts-expect-error
              <Swiper.Item key={dateItem[0]}>
                {dateItem.map((date) => {
                  const dateObj = formatDate(date);

                  return (
                    <div
                      className={cx('item', {
                        selected: getDateStartTime(selectDate) === getDateStartTime(dateObj.timestamp),
                        today: nowTime === dateObj.timestamp,
                      })}
                      key={date}
                      data-timestamp={dateObj.timestamp}
                      onClick={selectDateHandler}
                    >
                      <div className="week">{nowTime === dateObj.timestamp ? '今' : dateObj.weekCN}</div>
                      <div className="date">
                        {dateObj.month}/{dateObj.date}
                      </div>
                    </div>
                  );
                })}
              </Swiper.Item>
            );
          })}
        </Swiper>
      </div>
      <div className="date-timeline-container">
        <div className="date-timeline-main">
          <TimelineScale />
          {isSelectToday && <div className="current-line" ref={currentLineRef} />}
          {scheduleData.map((scheduleItem) => {
            const beginTimeObj = parseTime(scheduleItem.beginTime);
            const endTimeObj = parseTime(scheduleItem.endTime);
            const height =
              parseInt(String(calcTop(scheduleItem.endTime)), 10) -
              parseInt(String(calcTop(scheduleItem.beginTime)), 10);
            // 课程卡片有4种尺寸
            // https://www.figma.com/file/0abz6jPXkN1UaC49wO4mUg/%E5%B0%8F%E9%B9%85%E4%BA%91%E8%AF%BE-%E8%AF%BE%E8%A1%A8?node-id=458%3A12469
            const isMiniSize = height <= 24; // 最小状态
            const sizeA = height < 43; // 第二行不显示
            const sizeB = height >= 43 && height <= 66; // 信息块居中
            const sizeC = height > 66; // 信息块顶部距离 12px
            const isExpired = getDateStartTime(nowTime) > getDateStartTime(scheduleItem.endTime);

            return (
              <div
                className="schedule-item"
                key={scheduleItem.id}
                onClick={clickItem}
                data-id={scheduleItem.id}
                style={{
                  top: calcTop(scheduleItem.beginTime) + beginTimeObj.hours - 7 + 1, // 减 7 是因为是从 07：00 开始
                  height: (isMiniSize ? 24 : height) + Math.floor(height / 73),
                }}
              >
                <SwipeAction
                  className={cx('item', {
                    'mini-size': isMiniSize,
                    'size-a': sizeA,
                    'size-b': sizeB,
                    'size-c': sizeC,
                    'schedule-disabled': !scheduleItem.isEditable,
                    expired: isExpired,
                  })}
                  closeOnAction={false}
                  // closeOnTouchOutside={false}
                  rightActions={[
                    {
                      key: 'delete',
                      text: (
                        <div className="delete-btn" data-id={scheduleItem.id}>
                          <img src={deleteIcon} alt="delete" className="delete-icon" />
                          删除
                        </div>
                      ),
                      color: 'danger',
                      onClick: del,
                    },
                  ]}
                >
                  <div className="date-timeline-schedule">
                    <div className="schedule-container">
                      <div className="schedule-content">
                        <div className={cx('schedule-host', { mine: scheduleItem.isMine })}>
                          <div className="schedule-host-text">{scheduleItem.isMine ? '我' : scheduleItem.host}</div>
                        </div>
                        <div className="schedule-name">{scheduleItem.name}</div>
                      </div>
                      <div className="schedule-info">
                        <div className="time">
                          {fixZero(beginTimeObj.hours)}:{fixZero(beginTimeObj.mins)}-{fixZero(endTimeObj.hours)}:
                          {fixZero(endTimeObj.mins)}
                        </div>
                        <div className="meeting">会议号: {scheduleItem.meeting}</div>
                      </div>
                    </div>
                    {scheduleItem.isEditable && !isExpired && (
                      <div className="schedule-handler">
                        <button className="handler-btn" type="button" data-id={scheduleItem.id} onClick={edit}>
                          <img src={editIcon} alt="edit" width="24" height="24" />
                        </button>
                      </div>
                    )}
                    {scheduleItem.isMine && <div className="mine-flag" />}
                  </div>
                </SwipeAction>
              </div>
            );
          })}
        </div>
      </div>
      <div className="timetable-handler">
        {Number(nowTime) !== Number(selectDate) && (
          <button type="button" className="go-today-btn" onClick={goToday}>
            今
          </button>
        )}

        {props.isShowAddBtn && !isSelectBeforeToday && (
          <Tooltip
            overlayClassName="add-schedule-tooltip"
            placement="topRight"
            title="点击+按钮可添加课程"
            defaultVisible={props.isShowAddBtnToolTip}
          >
            <button type="button" className="add-btn" onClick={add}>
              add
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default DailySchedule;
