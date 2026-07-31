
window._availableUsersForMeeting = [];

window.openSelectEmpMeetingModal = function() {
    var modal = document.getElementById('selectEmpMeetingModal');
    var listContainer = document.getElementById('selectEmpMeetingList');
    var topicInput = document.getElementById('targetMeetingTopicInput');
    
    if(topicInput) topicInput.value = '';
    if(!modal || !listContainer) return;
    
    var myUid = (window.TG_USER && TG_USER.uid) ? TG_USER.uid : '';
    var html = '';
    if(window._lastUsersSnap) {
        window._lastUsersSnap.forEach(doc => {
            if(doc.id !== myUid) {
                var d = doc.data();
                var roleName = d.role === 'admin' ? 'الإدارة' : (d.role === 'tech_admin' ? 'دعم فني' : 'موظف');
                var isOnline = false;
                var lastActive = d.lastActive ? d.lastActive.toDate() : null;
                if(lastActive && (Date.now() - lastActive.getTime() < 180000)) isOnline = true;
                if(window._activeCallUsers && window._activeCallUsers.has(doc.id)) isOnline = true;
                
                var statusBadge = isOnline 
                    ? '<span style="background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.3); padding:3px 10px; border-radius:20px; font-size:11px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;"><span style="width:6px; height:6px; background:#10b981; border-radius:50%;"></span> متصل</span>' 
                    : '<span style="background:rgba(156,163,175,0.12); color:#9ca3af; border:1px solid rgba(156,163,175,0.2); padding:3px 10px; border-radius:20px; font-size:11px; font-weight:bold; display:inline-flex; align-items:center; gap:4px;"><span style="width:6px; height:6px; background:#9ca3af; border-radius:50%;"></span> غير متصل</span>';
                
                var empName = d.name || d.displayName || 'موظف';
                var safeName = empName.replace(/'/g, "\\'");
                var initial = empName.trim().slice(0, 1);
                
                html += `
                <label style="display:flex; align-items:center; justify-content:space-between; background:var(--bg); border:1px solid var(--bd); padding:12px 16px; border-radius:12px; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 5px rgba(0,0,0,0.02);">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <input type="checkbox" class="emp-select-chk" value="${doc.id}" data-name="${safeName}" style="width:20px; height:20px; accent-color:#10b981; cursor:pointer;">
                        <div style="width:36px; height:36px; border-radius:50%; background:var(--pr); color:#fff; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:14px; text-transform:uppercase;">
                            ${initial}
                        </div>
                        <div>
                            <div style="font-weight:bold; font-size:14px; color:var(--tx);">${empName}</div>
                            <div style="font-size:11px; color:var(--tx2); margin-top:1px;">${roleName} ${d.jobTitle ? '• ' + d.jobTitle : ''}</div>
                        </div>
                    </div>
                    <div>
                        ${statusBadge}
                    </div>
                </label>
                `;
            }
        });
    }
    
    if(!html) {
        html = '<div style="text-align:center; color:var(--tx2); padding:20px; font-size:13px;">لا يوجد موظفون آخرون مسجلون في النظام حالياً.</div>';
    }
    
    listContainer.innerHTML = html;
    modal.style.display = 'flex';
};

window.closeSelectEmpMeetingModal = function() {
    var modal = document.getElementById('selectEmpMeetingModal');
    if(modal) modal.style.display = 'none';
};

window.selectAllMeetingEmps = function(select) {
    var chks = document.querySelectorAll('.emp-select-chk');
    chks.forEach(chk => chk.checked = select);
};

window.startTargetedGroupMeeting = async function() {
    var chks = document.querySelectorAll('.emp-select-chk:checked');
    if(chks.length === 0) {
        alert("يرجى اختيار موظف واحد على الأقل للبدء في الاجتماع.");
        return;
    }
    
    var topicInput = document.getElementById('targetMeetingTopicInput');
    var topic = (topicInput && topicInput.value.trim()) ? topicInput.value.trim() : "اجتماع فريق مخصص";
    
    var myUid = (window.TG_USER && TG_USER.uid) ? TG_USER.uid : '';
    var myName = (window.TG_USER && (TG_USER.displayName || TG_USER.name)) ? (TG_USER.displayName || TG_USER.name) : "الأدمن";
    
    var participantUids = [myUid];
    var participantNames = [myName];
    
    chks.forEach(chk => {
        participantUids.push(chk.value);
        participantNames.push(chk.getAttribute('data-name'));
    });
    
    closeSelectEmpMeetingModal();
    
    var roomName = "TechGo_Group_" + Date.now() + "_" + Math.floor(Math.random()*1000);
    
    try {
        var meetingData = {
            roomName: roomName,
            topic: topic,
            isGroup: true,
            isTargetedGroup: true,
            participantUids: participantUids,
            participantNames: participantNames,
            createdBy: myUid,
            createdByName: myName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'calling'
        };
        
        var meetingRef = await db.collection('meetings').add(meetingData);
        _currentMeetingId = meetingRef.id;
        
        // Send Push Notifications to targeted participants
        participantUids.forEach(uid => {
            if(uid !== TG_USER.uid && typeof tgSendPushToUser === 'function') {
                tgSendPushToUser(uid, "🎥 دعوة لاجتماع مخصص", `تمت دعوتك لاجتماع: ${topic} بواسطة ${meetingData.createdByName}. انضم الآن!`, 'livemeeting');
            }
        });
        
        startJitsiMeeting(roomName, topic, true);
        
    } catch(e) {
        console.error("Error starting targeted meeting:", e);
        alert("حدث خطأ أثناء إطلاق الاجتماع. يرجى المحاولة مرة أخرى.");
    }
};

// ─── STATE & INIT ─────────────────────────────────────────────────────────
var CN   = "شركة تيك جو";
var MGRS = { admin:'', exec:'', tech:'' };
var EMPLOYEES = [];
var PMGMT_EMPLOYEES = []; // موظفون (uid+name+email) مستخدمون في صفحة "إدارة المشاريع"
var LOGO_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnkAAACgCAYAAABwp3pvAAAgAElEQVR4nO2dB7gkVZm/v+5779y5kzMTGaLEIYmggLqACXUlmBYxoJizYg6rsiri36yr7oppVVhBURFFEEVAUJCcMwMzQ5hhcri5+/8c9i08HKq6q7qrTlV1f+/z1HNn+vbtrj5Vfc7vfFEURVEURVGUtqmISI+IVIsylL0FOAdFURRFUZQ8MXpovojsJiJzRWSCiNREZFBEtlnHahF5QETqEedaafA771T0llIURVEUpUvZXUSeKiLbi8je/HuhiAyIyCjibpBjs4jcIyIXishVIrJCRNY7w6YiT1EURVEUJSUCLZNEXM0TkUNE5EQROUxEZif4200icoeI3CwilyH47kUIJsFYD8eLJAoVRVEURVGypJEBKux3lYg4uLDnzhGRN4rIz0XkPgRWO8daEblcRN4vIjMjzsE9jwqicm6R4vcURVEURVGyJEwU2STxQLrib0cR+aqIrElB3LmHEYwvjHle00XkFTy/x3o8dcGniReKoiiKohSFZq7LJK7NQIhNFZEXiMhJInI4SRVps52ILBOR38d43YkicjAuY2MJvNL5bK24n0NRkacoiqIoShGpkAxxAHplpYjcRnZrXPYSkbeLyLEisiDm36zl/aYneB9zrv0xn7tBRB4VkZeS0XsKsX22qEslgUNFnqIoiqIoRcNkuL5ORI4TkaW4Mo04ul9E/iYil4jILSLyUIQYMgLt2SLyHn72xPh8RtydISKXYu17Me8fR7wNh2TaNnrurbzHc/j//ZZ4TS0RQ0WeoiiKoihFoUq26ztxsU61zsskK+wsIoeKyPEicreIXE8pk0E0TRWBZyx45nV2iPm5jMD6lIj8xhJrlyC+3ioiM5r8/Ubi8qJwXbDGkjfCv58nIm8TkS9a760Zt4qiKIqidAwTyHy9OUHCQ2BBW4NwepQSJ0kTJz4VYbGbhXWv2d//VUT2SHAhni4id1l/b6yUX05YykVRFEVRFKUU/JsjfHwdRmA93xogNyvXuHzHGpzLkIh8g4SKuByOu9l+nS0ichoJGXFpmG2s7lpFURSlm+jFYjNJRKZxTKHDwSR+10NLqzFcakN0Pwj+vY3uB5tZmMf1DmobI3o+KCK75PDe445Y6uH/Nf6/rYn71Lhq/869EYcKNfVcy+FkkkT2FZE/Enu4gvfvxWU8l/vUCNPlxBFG3n8q8hRFURSfJCkP0W4piWkUv51GIP8ulLqYzmI5j8V2CgtuENMVvG+NY9wSfMMsuhvpY2oW4QdF5BGyP1cj/jYlWPS7gWbX0lyfnXIaB3M/HCgiF3Gda87vD2iSuLEKq1xc6tx/Ydm7U7AqPoPXXWWJvJm4j0eIHfwhbupIVOQpilIGCtUPUmmLpHXOkmAWzcUUvTWB9/sTeD+HAP6JrHs9HO2sgXXE3whWvqDP6cMsvEb83U582d0IwG62+DWrAWcE1qkicoKI7OP53My98AYRuVpE/mCJvF6SLo5p4BYdR+A1SrpwqdIzd2qD5wRW5j04H7tI9Hkicj73lM6LiqIoSkfSQ2P5Y4ll+g0L9QrcqKM5xHcF4m8Ia59paP8XrC4fpGTG3C6/HaMEk3GZ7ykiH0Ag+75uRpC/i6LGB5Dt2qw7xjoReVPCThyHkBXcyjn+FIt0nJIwj59UL380CdPgFnZEZsC3Ynau4i9OEljYbVT5cm/lcwcqfYTfjXJhZjOmK0LMworSaczAmjKKG0uaTIhVvjNbcZ3MYG7axmO9zEUVrCZJm4Ir5WYiLqtl1D97GsJgtmWlKxp17uVRRMNNInIF4u8G7u24VJx4sU6kn+v7XhF5WYIiw2mwCQtZsIEYaPKaF5IRvCLmey8hi/a4hPequYd+JCKfIDwgFhUmy9cR7DeTuAIj8vr4Mo0yiVYZ6IlqHoykyhd5CLE30XqszpdyEuNszPdfILhSx1PpVHYTkY+wGAsirx6jN2WNhW/UCoYf4bs0gXnLPOdcEflWgglWKS+mM8AR1D7bn3pp01irytbkfZx7ez0WnX8g/K5K2M2hk6lgbPpX5pA9C/hZH6Ce33nWvFaxrG4ui0Tk0yLy6oQGs3EswR9rFoMXxnNDzKK1Bkcepu+yHXHGz1y0nyRMlVaUMmEmu89Zwi7p4X5v3O9QnV33mzW+uKMxMXavFZFfscCNhtwHZT7GSeYw9/LFlOtY1sX3dE9IpuuhZK8W6Tqbee2jIda4SsQm1ljwvo/RLMn7jBEnuMh6raqTIBRJL7uhJSEnqbROnPGrEhw8g2wsRek0JjK3tBri4X6Pwr5XJiRiVyx9Y3oHdQwVAtOPobXUvrjNymaxi0MV6/QELN6HEsd3gYicKSLXImyLTj/f913pEduHeB2izMdyLO5xMo57EL+BCDau7feJyFdp7J83w8TGfd1JpolKEFvMZvTYFubDTbhpV1mPRVkKn0QvLhGdHPPB3bEoSplolvE6xGSYdTjCmIf3UPxghM5TReTllJHYFbHQLVT4vLsT6vAiGtf/ln6q6wp0rwfWpKlcs+fiRt8JN2uVcw1ice8nC/VvxCKudj5LMJ/UQh6rY8kzCRnfJXM6LwZxnX7ciqWsRMyHwfgsw6D2CC7ezdzrCyjp0xehBeo8/6aQx2PRS0zAELENil9GtIimUmKaTTTVJDvONtis36PSUA1JGKhgpTOi5hUi8ioC3rudCgmRuxCkfyHtta5oVgDXAxMRLXvRnusFCPIoF/N8fv8ccgB+TyztVdbnCCutUrVidM3jl4vI50XkO541S531+g4R+R8R+R4WNvv3rmCdwDkOkMhxOo+v5vr1YPk8nPt+rxDX7ziieHk7J38MGWrdHkeXx/HnHIs/KkrWmN38z5u0A2r3GMWN003Wnk5iItmxZuG+U9eEpscGXLjHUTzYtyeoh/c9XkR+iQux1TI1ptTNS1vInJ0es5dsO0dQ/9AkoT4kIldS/ibO5mMC2d8LGKtZPBZFL27632Fws897LYkncXlSPGBvjBNQsqPaoTEmiiIIr6znlqAemZYiKhcVSp4YC8bbRGTvbh+QmEynv+vziNn7JjF7wx7eexpdGI7Flb5Dg+fWG/wuECHGxftZLF3nJCgjYyz3ZyF00yqtEmQ7b6W2oXGRXicit2FFuz1mBn8FXVXDtR6EwjWan8xzLqGYsnEBv8Yq2zISI2a/YdhMr9WnT/FPrOwYRVEiCTZJKvLKQz+xW29B5E3q9gFpgVlY0/YTkR9j3VuVkQu3iqA7keu1W8hz6s7PgErIc8R63MQefgoNcpZV87JRC7QaZWeuJkmlVYKatg9SBPlGEbmL/9+dpBadw5Cz8Yy7xhth+WFKrAU19PpIzozCjQUMFXuvIy6v283geRyX5NSMWVF8MIcdepbu2holJ3SjWg5Myah3q2s29eN83N5pGw2MRelZhF2Elf5wS4SNO0ezUmLB8XeEv00jI8g04vJaHUdjtfuTiJyEFXlKgb49T7e+HxsR1o1oeM17MfNq0HI+BDeconTq/Z21hS1wj6hFvNhUKYPybnqTagxlurwAYXBjiq5bE092tIi8HgHpErZ2tfo93I9C17db1rxmLs7NDX7fiCHqzv0Hru48aORi/TvW2X9nbpvZ5PwaaohqM3+uoiiKoiSkYrnSJ1MK5L9x+anAS59BkjICkdXOpqeHkh/vp4WWLfDqKRon7NcxLvyjyNiNQ7XFcxjFtf2BHAWehJRPc6/XL0j22IyVseXY5l4N/lcURVFSJljA59O8/a1YhpT0qWGZ+j5WqjgCLyrmzViNjhSRN1Dawy3caz+/HSEZvI79Ggfjsr09Ru3eSovC51K68NzTwt9GnYe0IDjHHEFedTyq94rItykEXicG8+FWTlBbASmKoihZsAPZgm/U0c2Uq+ntGvS8DRMcYfUJXXZEjJ/gtNAKyELg1a3XmpKge83kiHNsxIMIp7QEnkR4QnuJR57PeY5SimUDR5BFXLcSJ9xrY/7mN2T2LmzH+q0iT1EURWmHMGuGyZr8YsIaX0pyHrZqDErEtYgTkrUzLswTHeud+3dpxL7aXSzc15uDhW5rk9fYjji+uIzSpeL8FM7fJhBnVUSdEcpP4dx2wwI3jsgzIvMG4ibvoyTLSIPYxkGKRe/QRvyhijxFURSlLVxBsQ8usRfpsGaKWfi/hMVHGliFwkSEbU07hISYl4QIPPt5YeVQwoRaEly37aQYblgjqPZM2EjgYtzZdomWtHIRZtLJ41ju/e14LCzjfwPFlU2pll+JyK95LKDijHsNMdhycqyKPEVRFCUtjiIrsAhN5Dud0ymGbJNEuBhB90IR+VDI9Wrm2m1XINnxaPZr9cbIEehHmMYtm2T65Z6G9UxSskYG7EoZuhOaFIcOmMGxB8Wgd6RNWiMX8mg7J6giT1EURUkD4576dES5DSVdTD/Tr+DuC0givIyl6dXUmHQzWqMEXs0RZWmJJft1tsUQNUtoAxaHFRRb/rP13LQseDsSc/oKq0NFI2qOgF1EqzRj/fs6dXPD3ONtna+KPEVRFKVdDhCRz6jA88JD1HhbyZu5cXhVx+XnMo8Ei3eKyFznd1FdGurOT7fTQhqMI8oa1fmr0FJt9xjvZ5o8fJkeu2kzl4Si4y33cpyxcEMbjDg8Bjf1o3TeiHp+S1S1UryiKIrSBqZC/7co96BkyygWvAubvEuUlc1Ywd5HDF4g8Oz4LwmJC4t67bRq5QVswKUaiLxKiOvWNP1/eYxs08uxkv3AOec0MFnAr0TkuQKv4gjgsLqCYY+ZsjUnx3T5JiLoeKF9HxVFUZSkLKDf5jN05LxgAvV/5ATiu2Iraj1fivA5IaQfaiMLnpt0kZRGGbr2v+/kiHLXVuia0iir1mQbnysi3yAWL+wztYN5rb1wdc9L+DpVazzFEYbG2PZv6LFTReR+53O3LKh7KZ6o5EOfWlIVRSkps4hJeqFeQC/cgAB4lDdLsvjPx4J3IrXbAqIsdmla66KwxVfQS/bOENewzRilSHbjsRpu66uoF3grnSJWZ/Q5JrChsYWma6ULSBq/aBJhXiMiq0Tkq5RdaZteTLZFas7bTUzUFj+KopQUk1X42nZaLimxuZ+Yx+usP4gr8kyCwHsbCLxGAiSuFayRmInzmCkpcpFTTkRCBNQ1JPccjH4xgu96BPCDDc4rLWYg8Ppjvp79OWsNrJgBkxB6y2ltNphG4sUEbe6dG5us6teKoihlwbS8eouITNUrljlG+JwiIuc5bxQnzGpnsktfioAICBNl7dS8iyrC3Oi5AcZidQ5FgpuxTkTOFpHfWwWDR2L8XbsELuvFlE1pBdeyFzVmuxKfV+WzbrN+5z6/Kb0UCfwpwYzGorcRk2jgSgx6rAWZuM3ajdjUnd1Cj/PhxrhRJ3ID+hSbIxSTrFq1eepWjGI/P0et5zQb3CBFus96/jifMwgm7SejZiUXsKV+dIqiKB6xF5hdaVy/m14AL/wMq07SemlGgJ9EiY/A8hRVxDhrt2zU65twsbNE5Cdkw8ZhHAOJb3qIa1zq4X33JTnmISvJpqXYPCNEbhORzyL2JmHyHER42T3keniDJDdakBljC8UeKw4tqD49i53h0SIyO+mHaIG7ReS/ROQfmK+nck5DCL8e6giNWDdTf4ICkROxkI7zNyOo8QrvNZO4iiutMVAURSkqwdxm5rV3iMizSn6lahg01rDR3sT8PxZhbQk28AMYQ2YR6rRdxqXI/ioi/9mCqJmCe/a1jmuxUfeLNIhrvRPW2rNJkrgrxXPIih6ut61R2hm7ZpbTfUnwuBP3baOM50iCm3M59WmknfYZbVBFsT7Vk8i7hp3DI/w/rB1MnIbOrRKI3DzGWlEUpVVeQ22wstVY3crm/hri2x5h3VuFgBplvnfj1AJDRbAW9FhhTqbP6v4ichBuvO1oJj8npXM23p4viMjtMZ5rW1qreOY+SvazWL/zQTOLU43P9AuslHdFZJ02+qxBeZVxT58ruC/624yjj6o/GEYPNQHvoViyG68YC/uLmqfgqGHp8nUTDodUCo+bhp4GKu4URSkbJtj9XS2UjsiTG8javJKSGg9Z839b7aJYfK/DGjWRoHxT52yZiOxNgP5eLb62iVP7vIj8sYUiu4dQ6DhM4MVNjMgCcw438ZkuwpO2NuRcmn1et66fL9wxbNeKJ87Y2589EL3zsMbe3GpR5yLtxiZ4zNKa4jRiVhRFUaKZjnBYVoIx2kDbr8sJ0L8bI0IWm+sRS6isooTHnwl9MoLvUOtYlOB1TTP9MxImFVTwhn08osRHO4kVcd5bQgwmweM3Ub/uIgTL+pDrkSTmrCXXZZtUuB7DuO3bqV9nF0tuZt1bitC7gXs5EUUSeSMeLVy1HG4QRVGUsvIK6uE1ax6fJ+sI4v8lYmt9DjHPdd5zEPFnBM2ZtOE6ghZWjYr5Gv4iIt8mZjCJ1ci4jD8kIs+xEgnj4L5HGmIw+HtjkfydFQO/rUlv3CJTJ5b+kTY6U9hjGyUS3cd7yFl4vYicllPSSSo8ky+E2woki+MsikMqipIds4m7Gcv4+3yy9uHOlANF5FpPc3MrxzDC7jkkthWxJFgF79EeVt/ZsM9q4tOOauEzmPv/zcQeBq9Vs5L/gn+H/b/e4G+SHvZrXUOZnYUF3xzEoUIs3oGIVnfM4h5hY9tovO33uZeuGKXlBVa166yPs514BUVR0kdFXvkx1/CHIWKgCMc4sXZBnKArJKoFFXyTscx8HfdbMJZGoL2/hbAl8zmfjYvavi5Rom485HetCJYoUTJMTb8jSl7s342Xq1AZ46MhYjorkWdfmzHa2oW5/SPv8yJNjEMpBMLGZdjjeymKopSV5xfUTWtcmd+ij+v9IfO5Wy0hb2yXqBEIl4jIFRgcjBtuHyxEP2mhuO+O1FQ7KGQM3P/XLcEizhi1Iojdv1lJPOH/kL3cKX3xA/epue8uoxpJUCcyiUvdvgb2Y3Ho4Ro/ixAA++8jz6FIIm+rR+FVj3lBFEVRupWdaV1WtGxaI4a+S9ZsVMxd0eZ393xqGBsuJ+t3NjX7NiZ8XWMVfJkjxOshQiKg0WP2OUb9fRQjuGdPx3pf2rgxi7B7KCj/cj5xeWHtzeJmCEclXLhFqm1hPs9Kwrg1zocoksjzKbzsgszdQKtZQBXrmEBG0YA1dlWra0nNSp4Z5Rhr45pmWaew6ATjHtyn/WSEB11U7Npdo1bG11hInE03jVc7f19lwZyEi6lm3cPCNaiwGd3WJWN8eIh1KE/GKZz7BQRRJ4x9nQSRuN0eXPYiKSaoFuHek2HCodHjjc5TIr5rw7gRv0rsZid5ycIE8Dq6hC1CYDeyyoWNc5KC0fb7B2vCs6hX+UknFCaUbo1j6bZevXEmw6p1TGLHsISq7ubYnp3LXEdwjPJziNIFm/kSLCfG8gEykjYxGYzHFG/dIvCCce9HZMwmXnQxP2eTJLTQav03wPgH1oC1dKp5mH8/Sj2wR/j/2pSz19OoE5UmAwndib3WmG+Hu2sXaps9hXpnVcY2OIK58hHiqO5lR38397wdQ9MJmHvuSMaiCJgszS8j8tZ1yBi3SvD9m0GSxh4hr1NxfiYl7t9tJf7uG2TPdtq8HWXNu4VY1R0oW1MNMaa0Yxl1sf92EvGOv8B62hANVlYqVGhfxq5we3YoO/PvmREm6ThsZlF8gBpS91I89EYeH+7SwtBBL+QZCIt96Qe6A8JufpvjPoy1aT0xMqZG1d+ZEFZYVr9WRZrtPiiC0OuJOYH2cl8fxs8llLbYmWuRZBIephjuzfxcgfvkJjY0do/vooniZlSo7XZYQc5nK032/9PqAd7tTCRZ8ZVscmxcgZfGfRf2XTfzyw+4Lvd3WQjUEKVuTqGP88E8XnEsa2nOkbZQNPGAx9GWdltKr585ByIAfGRtnVmyqu1pE7im5mH6/ZqI3Odp7LeSBfZtTN0LmoiZQBB1gvW1F8vRUUwMZ3sc93EEiAmKfhtuuBkZZ7/5yq79WIN7qMK9vqeIvJFm34MZncf9FLB9DaLdXXztcyoyc/kcPu7LZsejJBX4KpRfFswi/wdn7NrNjI2TORscxnPw4QJZevOiSlmTFc51sLOX3UzmtK7BbZSeKw0q8rKnhy/l80TkmwT9PpTjBD7IOXwAN1lYF5JKyWoshS3gvbhbTyBofF3OC+c4k9JvaGK+fUaLqC+R94EIsdqLK+WbuFZHPI3vNmKTjPjcKST+t1rwmOCjnIboeR2rEebdFl7TDDMebyAMw742aYu6sBIrdTwz79SuUY8zhSLUj4R8T9IWefa1MAaTz5bJI6siL1vmUW39+5ZpvUjH1dQfOqANN2XeuIK0itB5lYhcjKupaOM+SDmHt+C2dCfuShv1xvIUecG4X5nj2Jp41QsIjJ/rnF9RNy7Tia/K+75ciwUvuK5l2+xlyUIK+tvJP1EirVVxYf+tfV1uo+jypM4d3pYw881niEuvN7ku7VwLV+iZdfMZZRkkFXnZMAWX7Omk5+c9eTc7bmUSmVfyDOhFLO6/sJJTin5cyY50J+eztJq96kPk1SggG+xmJ1AY9mwP4jLuYYT0/4rI00ogVJ7JdzDv8fqoxoxH8mqSrNzvQVTh47Tcg3eIyMuteblHhfcT2ImsW3feSVvkud+VU8uyVqrISx8TF/R5Eh7KIDKCYyuL9KtoU1Qmqojqc0ok7tzjfFz6k9scdx8ibxjXkWCFeqvHOMekx81Y04sqXnqwiuYpjs1i9rMuj5luxCwR+XnEuNkCIC03YfB6d5DkYYuJXhV5T+KIEO+BK8DTsOTZ1+ZyqzBzoVGRlx4VrAbnFXSxi3sYy+PnStRneDpBuLeUfNzrZEN/OqKFTlx8iLxRNjL7UT+tiC5x+3iYAsPtCugsMLGZv815fC6J0cC/W+lh4xsWR+0u/O1aj+zXvh/roZ21q3GS4UwgXtJNxEj7sEW9SU56Rxks3yry0sHcZMdSLqPIi12S42csQEVmT7KUy+AST3L8yioPkBRfMXmm+vulHhMr2j02kl09s0D3cwUr45ocx8Ukxzy3AGNRVBbxfUpTzDUTecar8u9WrK7GRjZnNsleoxleI9dyexEl0AqNirz2GUDRP1iSxS7JYSwM+xd03A9GZHTamAfHzU4sTlx8ibwyHmPUfivK7tvE7n4px3EcQfiqgIjmSGoyBmOWtcAzQuKXEcWWlcY8l5JVvq7VWjLRn4R+oTqHyWSjnUrtuU7jxWQGH1Gwz2Xc4qeVrV5RQswO8eu4IbRsQjr0sCE7tiDnszjnFmZXEYdby/EciswEsiibha7YwrldbiRh7251zybGeNLOpSGAeBi/6Xx/p2f8Pm2hlrzWmUw22tYusIDcQdaqSx6T0LPoJNHpYx4c6ymAGnciUUte8+NmavnlSYXvlFv+wdfxKHGKSjT7EWDfyFU73mZWre0CNOLkPVZBb3XTNiZsbPalp+9Yg2tWS3itokqp1BHlTwp30ItWDhoFupo6Um9C5HVD7aKnEPv2spDfpRkQ3Oy1/gXrVqvxamVkBi7G12h5i9TYi4KmeSYXTaStYV5WgEspzK2EU2Ge2bVBq7K6NWe1Mg/Wnb+7AIEyGPF+yj+J6hN8C8XvH2ky7vbPsOtbd37v/i5gBzxLTyhsryKvHNQjvmQV3D0fLWGpkXZYQObnntZr+JyEDiWwthuzAAcI0J9TgHPpFMzu+305zscz2DzlwTribTd01BVNl2n0uA4ysqPWgjhzYNRaYhc8vx037QPOc9SVHk7dsqrZjOHpud56zBWCjcR42HWqN/ibSZRSmW0/qCKv3DydKtvdWFPKWED+n1O4N2oCa4Wo11pKyY69s/lYpWCVtcNX2qeHEhXPzmksl+Qo8q6in7ASzVLmOzvDNYwk1rsoa98I1QwuUetdKtxJj+E1zovZY1txLHiuVc+9VmFWXGEe2ZX42sdRkVcu7Attdncni8juXTweL0TkpmlVauTqMDulDxKL162cj5t6YxePQRYY6/Tb+V77pJfsyaU5fOZN3E+rcnjvMmE8BrukvF6HiQmhHNFvdROXGsOIvL/GtITGEdaNxPxSvs+PP0dFXrmwL+4JZJx2O69gccyaKtmlb+ji8T6XDO5rC3AunUYFt+1LPX+uySwKM3IYTyPu/pbD+5aJqSQl2r2P27GwuZtY+99jxJDdGfF7pTXuYVwftca0mfZqddyNwWMfe7OoIq9cBDuBw6kpVdZG/mligkxPog1XGkS5aU2Nqo9b2Wbdxh9peXV3l35+H5jEh+M9h1/MwErkezGvkQ14h+f3LRuLiLMKgunTdKG6c90dfM8DK57qg3SosZm5McarNfIkhcXjuYkbExB5j4cx6UUsH/PIcFzY7QNhsT2B61l1xViABass7dXS5iLG967O+liFZBn10Hwxn6w835hEiz/hslWi2Zl5LVir2407DkSE+xqjuGlvsR5LM8a52zHWvL+IyJY2xiFM/FVChN5T7F62KvKKj6vsj+nymLAojqBvbNqYsT9ERJ5TuE/sh99TtPeWIpxMFzAXq7QPK30VAZFHy8A7CO5XoqmyWG/HM9wyJ2kQvNZtfNftWFsVeOlhYvMudizXUeVwkuLeD3NJwHjM66QirxwEN4HZcb+zIHESpijjEEcRJoOgZ+8uKb/ubOoQdmOnhz9REPXOGM9V0qEHS96uHsazFwExO8Zz06TGYneP5/ctG5Ox5KVZ/7QeIRavUdd55hghfTVW0zSIWncHcPM/JvK0oGnxsTOg3plT6Q7T6eAfIrIcc/NWgkjXsVGYyWIxg8DPvXPqd3iAiLye2Lk0qGI5PTyHz5I3F+Ki1Rg8/+xA8dubM37nKkLC92bflOlYyUZReeL1sF2kUwnL6ctojAKRN4QA0VqF2bKBpLVjLOtsVH3DRvXwpIlhpULixWO9xlXklYeDcUf6tOLdQZzGJez0Bq12KqNkYwn3UZ/1cyHu05fQGcIXxpp3NLGPB9wAACAASURBVE2108gANfWG3uVWEM+JGqJ6jEl5nC/xpAwC9X/HhmJ5AT53FmylCv1Gvk9G6MziKIKVfAa9kP+Xc82KvpyKWpvPdG8O71t03Bi4+Vhkshbh91A6ZaS8Q1cK6ljy7rBEnjRIpmhEs+LXs5lH1qjIKw/Heky2MMHQP+S4x+qJG8U4MQcBa6ia/ksKvL6FLhE+MHUDX86k1Y6loIcSNXkWPd5EHMefSXrYwmca40vewwIwkbiqFxHPNaWN97yMWoCdJvAuIuboASzTG7ln64zfNMZtFoVnX2IHL3umwn28OGMX2nRPbmGXlR6slGXEnWP3tQrbZhUSU6et3PUxnqu0zy0YTQ5oME/H7V7SaEO6E/NYoZLlTC2g6zw1xD6zZF0idqcyvI+xMbWrXpViUdZe4uTO9HT+dRaQg9o87/mIK1/nbB/GrP/fCOQ5MS2JvezeTKmX74rIwy2876UsLGlhzucXToNu38ftuPDnM46NJsZAOE8my/WLbFjyOG9j6Xp+itcijH3YDPn8XDUKIGt1gMZMoaPPVmvc0jjqTnP7DcQcaz08fxh37X3O92Lcubbu/5McdQwCj5X80sSLcnA4i07WmB32x0TknBRLG4wR1/UhEfmOJ5eASSHfv42/r2B5PCDFc4rLVdT9ez+i69GYY2bGeS3C9ANYIf8rQeX6K3BN39DkeWVZDEawRL9SRH6K6B1hAowimGzNwnoT/ZFfTMiCb2Y7LfuyYJLVD9UXdSuuV4mm346rShH3/t9kbWQUP2xss5RKHCYQ09mn7triM4tK+FnHhd2KsLg4IyG2AvGxgYzNNDPGXPoQxr9hcU+KGeujcGf5wuzAviciX2KX16qrOVhEr+aamgzZU5q0vzsXF20z035ZBN56PvOP2gwm3yYiV9JRZQUWj6yC4F2mcs36UszGc5ns8fMEjBNbOuT5fX2wHV6LAb7PJhxgs4isbmEemsAcmZUhJvguryM+VfFH2CYn7bm1h/uwR0Ve8dkP12OWVlcz4Z6KIBiL8fxWMYvmV/hMR2U88gcTT9eKyAuyG30xhmvwc4xRWmzDKnsXr/38EMvAT+iB7DbQDqNeAqG3DsF6hiUk2q1HFVi417ARmprSuTaigiXP1Lx6MIPXr7KJ8W3JGyYkZDjGc8tClfnsZEqeiOVuG8E6/kXCkeIywPXJwpJnf4eXZ3R/KdE8wlFvEH/X7jxbxRI8Ud21xcZcn8OcvoVZcAZNlAOBl3bBTRvjfvyGh+y6pRQxTmqpqBCrlHa9vSjqWJzSFngB4ywyb8ZiF1iFzPt+iyzaOAIvoMhunRqW0J87lqI07mXjYvm2Z9ft/AyzX3vxEvhujTjUYfXxpmDp/S6VBILi0jsi+PYgIerohK87iUU6zTXaFXg1vAbadcQv6xHWWVnoA0x2bb+KvGIzQGHULC2uJknhq1bzZLGCQbPiAoTN5gzfo4I1LmkrsirJBz6KH5sx/rWIfDQjgWe/zyqE5Bm4cX+MS7OTJvgLsEy6rpBaSvfzahKI7kvhteIwJcUEKJceLEW+ywMNcS92AlW6wZxKFmzUZqKvhfCULK59xfm5mWxzjY/0i4mTfshDyIIReVNU5BWbuSRcZHWdzMJ3Vg476zq12LKe7HekzlQStsMC6INbcC0+6uG9KtQOPAn3/1sTWvCKjlmoTse1miUXE+uZZVhDQH+GsasVBJ7vkJ0RLBllxwi3E0TkvTFKFg2zqCdhIOO4ZSE27EGtj+edMcKIstzYC6EYaskrOAehxrPiFsoZxM3ATJNbSA7Isur9UmoFJeGAFMqvxGEcC0BUPbq03eV1J3u0k2KihE3D5R7ex4zd2Z5avQ0ErYkyojeHbhfjHSAqpiPuTovpKai1MMcOWK70rLwqmzpso1cm1nlYd80mboKKvOJSzbhReZ0SE0EwsO97wYiMv2TcSmcS8XVxF8oqVjwfwehXUhQzTORWtK90IsaJKfWVJXijVbcyS/ozvhfzSKIJ6rSVlcnEsX5GRBYk+MxJN7M9GVlZ7Wu+oUOsqmVksyXyWul4EYd+TbwoNnOJDUs7uypgDQvVeI6C4kJiArNcLBclsIZO8VSPsI4FNWoXHZZxVfW4KGeZeJMFD7TQGcL9jEkW1S3UFcw6nnFihpm8dQ+B32FUS7yBmUv87AcSWlhrLYy1j+/ftpy8OMr/xeNl/f3rVUtesVlKfFhWX/aVlhWtltPuegU9cbO82edRWDYOAwl25+2wHPdilNsq7HqklTwQh6wTb9JmRcK4xqiSKkm+A7e3WJ4nCT0Z17HL4zuf9WfKiinEz36ohRCaaguJXD5iPkdKblUtMyMZhypJ0PZSRV5x2TvDzDrBGuFjImnG/RnHh+1AAkYcZnlqd/c7RIKSDqsocRKXMBE7nnDBW9lCMH1SWrEAxSVwIfoW8z05ZPS2i4nB+zDJSq0I1EoLrlcfG62RnKy5yv9d26zW3+C+qarIKzZ7Z5xdtTzhwpjleWSZZbQYoReHRQmsfq0yTiyeZrSlx/KMy/GEsSHjeFLhXslyAzTqwZrg0hMjG7VIGKvdRxB57bjOk1rM0hZ4YaLRp3dAeSLNeminxbiKvOKyIMPYlXESLnyU7mjG1Rm7vSoItzg78MUeisNuxL3oe3HtZAZzcDuNerCEZ5mkUIvRyzcLJnjYSKXFHJq8vy8FF3MrC3fa18aN9Z2QYcy30pjJjgs/i+/hY2E/KvKKySSCfLP6Ao5ihSiCqf5BDwHsc2MGSvvocrGpIBbUTqInh0QRX8kpWb1HjXIwvjcbfR46+KTBLATeu1PY+PW0EJOX9v0V9loDJXSddwpuS8EsrrXxAgxr79pisoBJJiv6acFzE7FFtaDPHRP/qDXJZLHI1C1Xwf4isjDjq7AIF1EjMTmRFkRZL9y3USNJSY+k8XRpkMd7pn3+m1gIfHR3CTCiYonH92uFWWTRvi0lEVRtIfRm3MMmfLKHgstKODOtsa9bP9Ncf1TkFZhF3ARZYW6kl1Eo+F4mlFncdFtJ765mbMoPJrA9acSeJTNjWPJmktGctci7kqQXJT1GcxBctYIkLrVKnTjGbVgVfDGB3q4DBS3fMQeB944UQzd6Wqh36CMpYlaJXOedRJWxD9tcBYIvjXXosTItKvKKyVwPwclm0jmQo9OJ075pMtbMrEXeHR56FnYbeVjUym7JEzYbvvuW9mLJm0dmfZ64pXTMwvsxih2nWeYlSDbpTbAxGLQS0sLqZqbBDAwKWb2+Es5EOqVEWdDTWoPM93tYY/KKyUAOPSU7mThu56qH+BQzwa/V2lSpk8cC1UoXg6KxJaeOB/M9hGjEJbh3ZmPBe3sGdfx62UAmsQxuziB2t+78nIpVVV22fpnM/R/cD1kZFkw4xqCKvGIySdtaeafPQ6bZsLpqM6FM3TmKxCYSn3wzy0OIRhwCsWMW3E9iwcsiu77KeySJs95Kcpy9IWxnMxP2txO5Dll1VVHCmYO3Lljjs8qsXa8ir7hMU5GXKnEseT6sp0MZ1wTsVvLIrpUOEJdbSbzyjXFdPiXfj/44pmzSf2DByzIBZQlWs7gMskhnXTB3J0SH4o8lWLPDrkdac8ogxdq3qpAoHlXMuXpt0mNSDBfMNA/tltapJS8T8hBbWScm+WDIQ9eOMPoRPHmHpBiB93kReZ2H775J7No5wfOHsLTaIQHt3OdR1RIWEJen+GNHq4xQIyteK11Pguu7hQ2cirwCMsCOUl1Q6RFH5E33sOg8okkXHUMnfD9NBueaHGILqyxyPrN6XYz79BQROcGTWB9IKKaGmSvsRT4Nt577GlMzLtelPJEe7oMg2zqrecRY6VcbS7CKvOJR1aSL1IlT2b3Pg/V0o3a6yIS8Ei/Kzjh9f/Oo27g0oWUrTYwF73Mi8mqPHpMBLDhx5/YRNoVZtz+cjlVViyL7YR4u8rDYzyjBFzbXNLPyreX+UZdgAdnmsZp+tzAWI6PVx6KtpQqyYSyHce2E7FrzGR7IqZTJUgqy+8YWeFm7aG3MJnMZ7x+HOuWWAgGe1poQiIPgtYzYOITroWTPASKyXwyjgx2j18p1XxnE26rIKx7jKgRSZ0uMRu8+RHWvfucyIa9G653wPV1HL2XfmOSLp3t2Fe4rIl8RkeNz8pbskLAu6Urc6VmzP4XxlWzpQ+S5CThRnS7aWZMeIjtbF5yCoiIvXQZjVI/30TVBBbxSNLbllGFbIcPWRykVE//0HJIsjvNswbMxxYd3T/D8tSzWac5LlRCPwkJEXhblY5R/Mot73m50ELUeNBN4jSx8w2wOHjNsqMhTugE7EzLqyzHowf1WVTe8UjCMlfvGDArvxsEEoB+a8XtUKFlxrIg8z2NG9HjIfPJQwmzmR0XkFqsrSRpzhz3/BQLDjMlBmmWbOcuwJrvjH4c4zw1e11jnlwciTwP8i4lae9Jl1Jpwo8a2z4MAU4GnFA3z3bhGRO4Ukad5PrfpCK+zMizlUmcD9zB9oycRwxl0+xglw3QGj91HVuIEnluxBNuoFYs5xjFqHRWshnVcZUM8VsNKZh77h3VutlUtbF4aRuSt91Cw+GAROYwYzTL3ZC4q5v46sk3LddxaeveIyG3B81XkFZNW6uMo0cQRVxPUsq10KStzEnnme7m3iDxVRM7L8H2MgDxDRH6PVWwEITOMYOvnCDrSBIItsPrZ7cDcf9edx4O/cXsbVyzBmCQB626uz5KMN4km6/NfReQyhK6SLsZN/yyrdEpA1H3gxulVGsTu2Zh792YRuTd4TEVeMdGdVLrMDvlyuWzwMO4qIpUisplMzjxYTLzcBTHiZltlhEWvCBvnKsd4zM28EXh3IcD7EgrEMBrFgB2G2/YBLfWUKr1YSpPEY0bRTOhtwYq3NnhAF51iMqRN7FNlBkKvEaus2JesWKDBzUoBMRas24kB841Zgw4nwzNL8hJ49oJcJfh+XoK111yTm+h+kQaNhOV2CO4ZKb2X8n8s5R6faY1HoxIpze7VRr9fj7v2cf2gIq+YrNWdVKqssnc2EQx66EaxPROpohSJOrv/23I6pz1IjCh7m7gw7EU8SAJ5JuVU4mCsm9dSyzALoVp3BMfh1M1TbZAOfYzpgTETLhrF3VVi/O4+RN7jqLu2mKzP0HURsIkbYo1z8/ST4l3FzVGk2MCwGBdxXBh2gPR0PscPYixgMzwsMiZ4ejcC3dUlrxQJIyIuR4D4xiyERxMzd1mH3RU1598zKQLdgys2TkcLY2W9ATE8kHFRdZMY8Frc93dm9B7dQi/fp+MpUxOHdq6tMVJcJyIP2g+qyCsmGzNuZ2NE0DdF5Lu8VxDrUePnBO6N0QKIvGCSrDYQeQF2EHTNCqheRz2wRvR4ENbCTr5PRZ5SMDaTfbo2RmhDFpjNz8tYpLZ06M1RZWz3YCGeGHOeX43L9sWIvCjiBObH+f0RIvJ8RGizeVOJZibX7BkxrHj1CEtdnIza4HePsBl4gmtfRV4xGcxY5Jlss7/kVAS1qDxIwPFuGWexBX0iB8s9XEoHULE2d0KA/105ibwq5VRMAsb5HVpdwGzu5lMQdxUekzixduNY88xmdW7Ec+IIvEbYf2/iBl+EZfc6rfTQMrvQ1SUQ5o0EnkuURa/RNb6HzNonoH73YhKnDVc7TKQGlPJP1tu1hTJkmY69UhDcIHzjsv1Tjklfu+MqXFCYEUqXCgv+QsrGhPWLjSqYbix5tzoeADeezi3nknQus5//bBF5hee2c52Eib1+OcWPm9Goe0Wz3rXB74zF9YqwsCQVecVkU8Zm8nm4DCaUeZBSZowq4VkvcDsliM9QlKyxF3azufwjYiIvDsei14lrk90Fw3SX2CfkOVEL+iq8L5sjnufWVGv0Wo0I7gdjCDiBbNu82sCVlX5iTI+3NvTtCO5GjwUY79zfw4xDKvKKyVosS1lalUwR0mllHqSUGWcizToubw4C22eoRFDYtROzF5V0uSNnkWc2oO9o0si/mXWjqATnXCMJ61khrvGo/tbmsUspjhxWfqOewbiYGobvpK9tGGW9DllSpdbgCbjmJYV1vB7hjrev/c249J+Eirxisg7BkWUZlSVknyr/ZIWHWLkeXDU+6+W16r5Rug+zwfybh5qRjTAC72MismOHjX6w2Qq8Bc/ELRr1XHdRN4v4xZa1xl7k687ftoP9WqacyrvxQEQluin/HHcT0/0mxi3LsbKvxWpiWUM7lajIKyZ1smSyjMvbjZ2a8k8e5AuTNQfmYEV12ywpShjGkn0RmbZ5Ytxd77U2ohVrvSqruHDPewlZrFMinusKvSHav9mLeSO3bbvnKoy5sUq9n/NVojEu+JNE5BjPnprrEXmh87uKvOJyI+VNsmI+u42iZFgXwfS/juzCrNmfNjfq6lCKiLEY/ZKQkTx5g4i8mQ1RlMuqTNSJ/bU9NPtHWCyDrGdXzF6HCB9xnhtFq2K4br2/id1+NUkxeWRel4GplAB6Lf92aWd9a/S3G4ijvTfi9yryCsw9FCrOkleSzi8FEFlFmLy3kcWWNZMZe20fpBSRMQoT/z3nczMWrk+KyIeJ1esE96BrUd8Nt22wFjerp2aSY851ChW7ddXcv21lzIL1IPhbY1F9I51JJjvP61aCzz6JenhvCilxk9b9GjbO5j66WkT+0OgPVeQVl4eJy8vSxbYv2Ww9BZhAw3ateZzD9Z4KgL6IpuO+0CBpJQnLqVeXdzFcYxX5kIi8p0PKebjz7DSE01Lr9zZh39urRORCp5xKqyU4mmFrBHOO7xORf7WyRrt5TqlT8NiUSvmIiOzp6X2DMd/MZuyWRk9WkVdctobURcqC4wscmzeRL5HPrNAbPWUXmsXrRI/WPHtx8Zn0oZSXS3POtA3oJcvTWPR2LvF41iOyZ03oxpEJBNMmBPiKDM7RJqzzwp4ImuMQet0c52tKy7yA8bDL4YTVK0wjw9a9P0xdy7/y70gxryKv2FyZcfKF4VDiCIpWTmVPsro+T1FOX7Wa7vcYdP5SXCCTYzw3DYxofglB1C9FQCtKFLfjGhwqwAhNw6L3VdpElbV2W9iaazZ8rxKRXUN+FyUQrsVN52ba2qSRZRsWC7kvwuZZbb5+meln7XwjRbzDxi0N74krFm0r3nnWJqwUYQwHWi1Usj7OJMaj6CylgnUt4/HYjBm+KMWRX4wVYYzzMzvW13l8/zd5ug+DsX+bh89kJod34Yar0+fwy1RmzwoTpP0L6zpmdZycQwKRERk/9nBv+LzvwzBz0O88fh/iHFfjvn1KyVpzmm4XH8QF7n5Ok0jx7w3m4DCxcBBdDoLXqDlH2GNxjiBucNz6d9h1+ROZpLMbnGMnsphajhdz3erONXDHzf5/q9dj3HmPC4nnLBUq8p6McVOe4WGRrNPH9ogCfOZjKMjqnp8pG/BCT+dwJFlLvhatFVgnsqKHTMVHQiakz2e4UKrIa+8ogsgTYo7WePw+xDm2cm+9mALjZWAAl/NgxOe7mRqaYfSGWAF7EY3296vmCIpWxcW4I05coREcphrBJ7ooicyUSflCg+9D2PgFv2v3WgSvY7Le3x73hNVdW2zGcR1mWRQ5wNy8pyBw8mA2Fq3TrIxfmx1E5FQaPmfNbWGNnjPE7Ay/QnxH2t/JWbhnTwvZ2Jid91tF5DU5XXOlHBirwZ8LdqaTCDn4LCIjy01SWgyzeYxidwT1xJDfh8W+jeGyvdp5PC2LmpthK86/hSb872IeWZTS+xaV3fB4vTFkY1F3xiZN97ldI9LcB5dgXS8daskL5xnEifnaId9GeY9Grts0zfI99Ec8E8tFs/O7jvPL0jVgXvsDniyo9nEvE2YaWYRmZ/1cEfkRMVWN3vcBYoLSRi157R1FseQJ/WTv9fx9SHJcw3enyF0yzJz6HxEWseBYReZ9XPoQHbZlqVW3oOtqjLLqBYd93qbG6M8wEnSa8agPL9dZlLBxr1mSsWz1CN7LlM45qgBj0hIq8sIxi/VvPE+Yxn34aRHZPuKc0hBYZlFehnXunoTnt5JkDPt80hZ9O+GK8L1YmQLYP6ESvltzKQ5BT8z/xsWd5Jq/O8KK0Coq8to7iiTy+rCaNdsw5HlswuL4YeLVBnIYp7B5aAK9wj8YUyhfwPwTl4Ui8l9OfFgcF6wr2Fpx8brnfg0FrOcnOP8iswRPyLUhnzUtEdfsNYL320Z4jV0doenaV6SG5QvJ/PNxc9yMmTvP/oxxGSL78nCPpS+mYUHchX+PpNjuaz+u8/HEFfxbC1me00hZv5+dTRZWvc18/oMyeO1G9PPZDuHnPHbGQ7Scct02VcTU/tTbMrF3b8H1myROZhqu8Dq9S8PcQ0mZRE2t3TPe3V9IWEMa5xyXHu7jfTN8jxHqYN2Q4XvEpcamYd+EAsQn/VjyDuUI5q9JXK/NHs+likA4FKH+LjoixFnfluLW/XvMUJ0tzM97WPX2whb/Ssi/69Zz2+3KYFhA/c8dma/WFCQ7Oyn9eJg+yJzqWojr1r+TjFm9wTi7JWvc55lEly8SWx2bMmUmdTO/Qgw9x+MY9JMEcTii+IekbAc3WC834GjE309g91+lWvpOTHhHE9vQbqCueY3/R5zLhW2+VhjjWKGOYwPim504XkhG7G301t3EpD7EGM9mAtqHn5PaOM+ZuKlHKVWRdY1GpVwYkfcDhF4rVmZfDPB9WMZmchXJXBdTV2w1VpE0N/kTsIKbUIu9mOueyjy1MGHJl156oJrzvSzG8+tYmk7n/eyMeTemLkr41SU95lOW6zDmZuM5u9zzJqxVejBEHMemeQ/ndVoVd83+ppnoM96r71HWKBEq8srBOnb0R+QQ7zCdCWs3JswVZIcNs0szN99DTJgDTP7z2NHNQcwF/1+csgtlN3Y2Y05geLADamdSqRPQbMTtx1M411YJrJb78HlGraOHhSXN0jczcXeNkwyiKDa/I+7qpBKMSoX5aC4L9xFY/9eSofgQ8aj302FoozW3DfId6OX7VeH7VuU7Nw0xtZR5bS5z3VweW9RmLb/tKdNhNnePxnj+KN6pfbAaRnl9ApGStvejFmIp3JlyVMay93MKON/ZwDCQNztgbT0Oz4gdupKmCHZfz70Wdecxs6H/31aNGSryysMliKos65o1Yo6TeTuGsNvGhDjKpDaRY4CfWddOMlaFb5Fhdw6PpfWeW3nNEwuSOVZl8s7abT8boWeu8Tcyfi+lXGwiU3sxcaNlYq5jgaxhFd+EK3cj/w/+Pc6c1m95JvrpqTsVoTeV/2dRnPkluOhOjxAFrvBYw6Z0mXNtXGuehAiJdqk4AjL4dy/x9rtQ7uZPbMhvYtzzZgfc6jsR4vJcq+6fPcbueLVr0Wsmtu3Hz+Me2OL8PpbwVJFXHsyO7mza+xSBXqx80wtwLsak/jV20j9I2S1wJ1lV70vxNcuAsb5+jMnk61322ZXG3EXh3iUe+3VmQRWhFtbtJ8iArebY93mApKJbcXfGwbjzvkMc7FLr+bFFQRu44xQkc1SZm58tIgcg9v5CD97leIMSxZmlgLGUPpNM5mWI/9kRmiiOwE5C3RKNYWLb9taZ+OgvEW5gE/s8NPGiPIwh9PYqef/GrAjcyuvI0k6LESahvZ1JsxuYwi68RhB4UjTxoj2KlHjhsgpLzDOwZnUa1ZwFXsAcQl3+inWxGXXmqy3EBE6xnl+xfkYJjHYJEx+21aofr8i+xOwdzhwzH4E1zn2fdm3YBbiyn00twhMJP3o6v5tizVGucAqrF5hWoorr4rb/bzZTn8HyGWaJjYVa8srFclpRHZZTeYCiM4fSL8Z1/D8pnqvZSf8nsSXdNu5zsOj1kuhShuBpxQ9ns2B/OuXSO8oTea5VKH59jLHZSrLDDDwQtos6EBFZfY9d92aYi7OCqJqCu3R/QoFWEh95N3Pu/bigg0SzMeb2cf4dfIZexOMkjgErXGgOnp59ieEOBN1EZ+NZd36Kda72v+3PkNQ62uy5tujeQKjM79q9ViryyscVZH1ql4JwFpOM0Y/rNo0dYR33wvkE5XYbsyglUCcZQ7NuFSFB4XQsMS/TEcmMXmrPGS/Ft53YrCg2UG9zFn8b5pJ2SSspo2YJINc6FiaierHkzUfwDWO1XI+1eCNxkpsRsGMcQV3ASQi3GfwcoOyYOabg5ZkcwxUrIcLNtXZWGnyWZrgiMYpR2pmexWdsCxV5xce96Tbjo98thxpuZWE7yr+cz+4wDdZQrX4+Ney6jSAZo4/yKtu6/SZTHmMt8Xmzcb0p2TCTeOybmNfisJIiyUbgvd5JDqlGCJx2aZSgIM7jYaKnx7LILbCeaxdyFkdoBa71Ho44btRGAq2Zha7dcWpULqVGJvLX0qpNq71ry4F7U9yMr75RH8Ru576Yro04BF/6G8jivbdLx9ZYBd6T0IqcZzxTlmQdxF4mbqPM0LXdPhAZswT3664J3sZ0E/omVQKytMDbyQQVx51pHwFRhZntLg/2712XrG2pm4T7tc+Ko2x0jnG+uxXnvNqh2Xva53shRpy723zPx1GRV3zCbpAawZindvvghFAnHu+LKSbW2LvGS0XkQxQm7kbmkh0Xp0B0TwfPMeMZBIe7lEkgm8SX95IxqWTH4cRAxk1QrBPf9mlcgPY9GxZXlkQI2cTp4hD2f3HezxVXUSKx3uA5UUcrJEmuaHSeUbGJwePGLXsu1+mmNDeRKvLKyxD9SbVg7T8ZxpV4MkVOs2Acd8n3CvB586DGouG75EEjGu3es6LHQ3WCakb119LELjx+Od+9VjKxlXj00rf7vTHj7IRrcwdz43kRAsK1xEkToZFECDbLRE2avNBqTFxeVBoIWWHd+gXeuavTTopRkVdujLv2c3x5ux3jmv0U8UFxKsS3wzYCzr9T0r6M7XAOxafjWLGGOTrRtelDWFZLNkfXSAw7mZ9KNvSSbXtigk1AEG7yWQL6h63fxb3HXEtVu/d/KxbDzkQILQAACXZJREFUIuNa61z3ddSYXUDVjOuz8A6oyCs/6/Dh/7RL44TqFCx+E+Pgq/bhSty2p5Ss3mKrjGA5fhut7eIw5knkuTE8Phj11J6p6C5bd6GuUcD1rSLya41dzAxjxfuoiLzFKetUtfqKu5hrcQ0JZD+nU5FElDtp5H5Nu3Zgp8TtNhrDsHjEMb4jpyLAMylroyKvM3iQwOefdll5i3HavZlm2L/0FCNlf4m3kAV1MjWdOhVjMf4CLqKkVlIfE3gei4SPDgLjaZRQ8EwwLjeRDfrdAvcqLTvzcfG9xlrLK03WdXNtbsHr8Q2qBrjCLeq+zuJ7VnaBFzZWYfUB3TEO6uAF4Q2ZrV0q8jqHB8i8OhXrXqezkbi41xH07YMw98IgZQreTKxaJxULHidL+T0sCoMx/sYm6PWZ9UTel0P3nj4PhbHrJbyf7IXMdMX4CCEla9SqlwlBDcvns57XENXNxno5xZW/ilciKvO1Ea0maSR9n6LTaBxcgVdnfT6d8e+qSg0H0o4qSbZMq8eZ9ObsVI6jh+G4p/H0eYyRXv76Am5S9qNC+WAHjLMpQvqjNnuTzidjLOv78EM0kPfJRCtEIqtjkM1D2THuw6Nx445mPGbdelzbYv3OoFjyP5xrU9Oj6WHX7nPHbdwKI7F/dx3jHac6QSqoJa8zOQcL128pntwpbOSzvVJEfmhVVs8juzKM6+mHeAo7tKzdx1kwjog2bqCTsE62Sr8H8VUjEcZ3mMKwBzdkUBus7Jhr8xsSBc7RQtqZsA9COinr6Az0SZJltJtNa9Stvwr+ba9JYwjxTxDb7K0EV7eKvHqM55Qd48J8Ka6260ueHLCFuIWPIPCusX5XzynwPopNuMxNE+xfEXtRFpfbBjYGryTbq12RWvfw2WshMTA+8FEDsJqDhTJLTBmPt5PheVdJN0FFZSsu8VYYo+7ql4htfjQiicCmG9bQVghLTNlMiZR34enpWp6GGPFhbj+D1lfdwlKazF/LQl4Wl8YWunt8mM/QiDwW+mZMFZFX8QV/pKBjXOOeuBw3wuQUx3k7PvtYxp/hEzk0yJ/BZ8vyc42yMHQiz2YTtLlE81FRj/UE8bcTghR0lZhLBv191ubZdjva7shxdek+6bDvkXES8j6VZ3hYkXrXDtCexAdTS1BkNE3MjfZ5Gla/SESOpfftXI9jHpcxevbdRYuXX8dwGdoZZUWyDmy2Gk2bAqZvoCXRdgVwwxl348PEiPyBHWZafX4DBj1dD99JF8IknrUlr1bC7Nq4XMIG7k24cXfsMKulD8YJCzmd2pXtuMHrzL1ryIgeImt3DwRKozpv9mt0ahvDONif3Qjvv4rI95lb1Q2OJe8GTzulszrIktfKl8pYPQ5mh/EnMnPzTBYYJTbkJjJVn48Qb/a53UW26BPMAONu3CI34hbJ2splH4GAvoZOKU/LeLMzkQzoLD/jKLXC8gg9+VrG18tsEk7I4XP55iCERVGt3UU81lPrrpVkizhUMAR8mLkqLGGm26129hGMyRBJLKbSxQJrnHPzNBXJkmdq9/yYCXuWNXhp0cNFuBfrSpHaMrVDK/W6hojZM8d0JlkzWeyFW3S2iMzMyOI5xoQxRBq/aW7+EPE6V3AfxMX93EnHwTeD1rjvypgfSAbrEu77KSla+UZ5zw24X26gt+hlGbZ9szFWqD9ipdkRkVuNeZ3Cel7aQi6wcl1JvGaac0VczifgfVe+J27PzeCckghQu1DqNWTJdzpXEapzCdbupzL/KE+mRuurn2CsWJ3RGNWZk7/NPfgqXOy2ccRHrcgsqbcpvNxaePcxJ5xBJnkhxqZolg8jOp8uIjtlUFE+cAVc32bGYCdTYcFaws89LME3B0E4gevUE1E8MxDndgr5GAkJDyIuHsVV+DdcNt3OduyadxaRXURke8qPTEcY9XH0Wq2ugrEPCuYO83PICsJ+kInnbuIxfW9sqsT4LRaRRVTp77VEULO/temxKvnb99St3FN5uOn7uF47Ic6DjWQQrzTG+fYkmGuDa2uu4T1sSodj/F2nMI+EsRcjoBd30WdvxiO0wDrN0xpmi7jtyd49mlJRs63nJRUzwfPz1B/2ObdyHm5R/GvJmj23aBUtutl/rjSnQszeFALNZ7Bo9ztFbuvWz3GrnVUg9Ia58Y3wWKvj3pQBx6o3kevQb4k92+KzmWMIoTeIANpU4M+oKI2YzYbfCL7DEBmdUE6mFVZjnPgJMcpbcjqPKpvRI4nrfiobUZsowWcLu2YWtHYFWBwavUej39n/D67LFYQ9XV5Ey6aKPEVRFKWoTCJ29HAROUJElrHZ7AZMx5C/YL27jPCWImB0w74k8T2dMJ8dnfNq1brn0o5GcV+z1ddy/+5RBN35XJ/7ipwgpSJPURRFKQM7Y0E6Ejf54hxK52RNEKt8A1a7PxBTW0QmElZyAEXgDyO0J8riWg/5d5xs3XZi55r14416rvt+Y1QfuIGagudTAaLwqMhTFEVRikCcBbmH+M4dSRj7FxHZnUzGrHsJZ0WdUJZrKBv1DxLSytSDfEdE3oFUENi7Qc3NVqx8PkWezWYSUC7FJXsDFtbSoCJPURRFKQLNFuSwbM4dEHkH4EJ8ColMcwpeC3U1lqF7EXQ3kjVbFJdsq8zhWjzDqhqwEIufa+FrJX4tzXi9qL8fRMhdQ3Lg30h0ySsWsi1U5CmKoihlp4/i7gtw6+5BrNjOPDYrx8SNOqJuNVUF7qDsz61kwK9xSgCVrTRJ2PlOYsznIMIPwcK3Ey7dVguY2+MUpzRRHLfwFoTdGlywN1Oa6boMCsR7R0WeoiiK0mlMIEN3MZm5C6kBuqdVnmiGVdYnTbbial2FaLiVMkYrEHprm2S+VyzhVOY6dDYLyMzdFevrfrh0gxg+n91OTHzdRgTcjdQBfJgEivu4PoUqg9IOKvIURVGUbmASdfi2w8o0j2MG8XwTEBy9HH2IrF5LeAXWo6BU0SDtxLaRNLEFAbEaK91KBF/SYt1lLzQcRZWx3h5L60KE3nyOmZb4nk5yR18C17tdiNyI7aCU1FqK7j9q/fteRPhqrl8njreKPEVRFKVrsYuM91jFxqtWcWu7+LjdI3vU6uAzZhXBVuLTa9UCnUKyxhSssItwwU9DjM+0sqlrVrH9UUtsD/H4EJbUFQi79WQpDyLQR1JutlBYVOQpiqIoilI0JtBacwCrXlAQPhDagXV0lIL7QdefMcslW8pkidQQkf8PFVN5RzesE+4AAAAASUVORK5CYII=";

(function init(){
    var c=localStorage.getItem('tg_cn');   if(c) CN=c;
    var m=localStorage.getItem('tg_mgrs'); if(m) try{MGRS=JSON.parse(m);}catch(e){}
    var e=localStorage.getItem('tg_employees'); if(e) try{EMPLOYEES=JSON.parse(e);}catch(err){}
    refreshEmpDatalist();

    // Auto-expand textareas
    document.addEventListener('input', function(e) {
        if(e.target.tagName.toLowerCase() === 'textarea') {
            e.target.style.height = 'auto';
            e.target.style.height = (e.target.scrollHeight) + 'px';
        }
    });
})();

// ─── TITLES ───────────────────────────────────────────────────────────────
var T={
    dash:"لوحة التحكم", emp:"ملف بيانات الموظف", leave:"طلب إجازة",
    perm:"إذن حضور / انصراف", delay:"التماس تعديل موعد الحضور", la:"سجل الإجازة السنوية",
    lb:"سجل الإجازة العارضة", lc:"سجل الأعياد والمناسبات",
    ld:"سجل الغياب بالخصم", notice:"نموذج لفت نظر", warn:"خطاب إنذار",
    inv:"محضر تحقيق", exp:"شهادة خبرة", clr:"إخلاء طرف",
    gen:"خطاب إداري عام",
    task:"تكليف بمهمة عمل", sal:"شهادة راتب", salrec:"سند استلام راتب", att:"سجل الحضور اللحظي", cal:"التقويم العام",
    comp:"الشكاوى والمقترحات", set:"تخصيص النظام", proj:"نموذج إدارة المشروع",
    mexp:"شيت المصروفات الشهري",
    res:"طلب استقالة", promo:"قرار ترقية", contract:"عقد عمل", raise:"زيادة راتب / علاوة",
    staff:"متابعة الموظفين", pmgmt:"إدارة المشاريع", account:"حسابي",
    tasksmgmt:"توزيع المهام", announcements:"إدارة الإعلانات", empdocs:"ملفات الموظفين", wkreports:"بريد التقارير الأسبوعية", devres:"مكتبة التطوير المهني",
    aiadvisor:"المستشار الذكي"
};

// ─── DOCUMENT NUMBERING ───────────────────────────────────────────────────
var DCODES={
    emp:'EMP', leave:'LV', perm:'PM', delay:'DLY', la:'LA', lb:'LB', lc:'LC', ld:'LD',
    notice:'NTC', warn:'WRN', inv:'INV', exp:'EXP', clr:'CLR', gen:'GEN',
    task:'TSK', sal:'SAL', salrec:'REC', comp:'CMP', proj:'PRJ', mexp:'MEXP',
    res:'RES', promo:'PRM', contract:'CTR', raise:'RAI',
    wkr:'WKR', ach:'ACH', req:'REQ'
};
function genDocNum(type){
    if(!type||!DCODES[type])return '';
    var code=DCODES[type], yr=new Date().getFullYear();
    var key='tg_seq_'+type+'_'+yr;
    var seq=(parseInt(localStorage.getItem(key))||0)+1;
    localStorage.setItem(key,seq);
    return 'TG-'+yr+'-'+code+'-'+String(seq).padStart(3,'0');
}
function escH(s){ return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ─── Make text expandable if longer than threshold ─────────────────────────
function tgMakeExpandable(text, threshold) {
    threshold = threshold || 150;
    if(!text || text.length <= threshold) return escH(text).replace(/\n/g, '<br>');
    
    var id = 'exp_' + Math.random().toString(36).substr(2, 9);
    return '<div class="tg-expandable-text collapsed" id="'+id+'">'+escH(text).replace(/\n/g, '<br>')+'</div>'+
           '<button class="tg-expand-btn" onclick="event.stopPropagation(); tgToggleExpand(\''+id+'\', this)">'+
           '<span>📖</span> عرض المزيد</button>';
}

function tgToggleExpand(id, btn) {
    var el = document.getElementById(id);
    if(!el) return;
    
    if(el.classList.contains('collapsed')) {
        el.classList.remove('collapsed');
        btn.innerHTML = '<span>📕</span> عرض أقل';
    } else {
        el.classList.add('collapsed');
        btn.innerHTML = '<span>📖</span> عرض المزيد';
    }
}

window.tgToggleCardDetails = function(bodyId, btn) {
    var el = document.getElementById(bodyId);
    if (!el) return;

    var computedDisplay = window.getComputedStyle(el).display;
    var isHidden = computedDisplay === 'none' || el.style.display === 'none';

    if (isHidden) {
        el.style.display = 'block';
        if (btn) {
            if (btn.innerHTML.includes('عرض التفاصيل والبنود') || btn.innerHTML.includes('عرض التفاصيل')) {
                btn.innerHTML = btn.innerHTML.replace('🔻 عرض التفاصيل والبنود', '🔼 إخفاء التفاصيل')
                                             .replace('🔽 عرض التفاصيل والبنود', '🔼 إخفاء التفاصيل')
                                             .replace('عرض التفاصيل والبنود', 'إخفاء التفاصيل')
                                             .replace('عرض التفاصيل', 'إخفاء التفاصيل');
            } else {
                btn.innerHTML = '🔼 إخفاء التفاصيل';
            }
        }
    } else {
        el.style.display = 'none';
        if (btn) {
            if (btn.innerHTML.includes('إخفاء التفاصيل') || btn.innerHTML.includes('إخلاء التفاصيل')) {
                btn.innerHTML = btn.innerHTML.replace('🔼 إخلاء التفاصيل', '🔻 عرض التفاصيل والبنود')
                                             .replace('🔼 إخفاء التفاصيل', '🔻 عرض التفاصيل والبنود')
                                             .replace('إخفاء التفاصيل', 'عرض التفاصيل والبنود')
                                             .replace('إخلاء التفاصيل', 'عرض التفاصيل والبنود');
            } else {
                btn.innerHTML = '🔻 عرض التفاصيل والبنود';
            }
        }
    }
};

window.tgExpandAllCards = function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var cardBodies = container.querySelectorAll('.tg-card-body, [id^="wrBody_"], [id^="mrBody_"], [id^="mp-body-"], [id^="mp-emp-body-"]');
    cardBodies.forEach(function(body) {
        body.style.display = 'block';
    });

    var toggleBtns = container.querySelectorAll('.tg-toggle-btn');
    toggleBtns.forEach(function(btn) {
        btn.innerHTML = btn.innerHTML.replace('🔻 عرض التفاصيل والبنود', '🔼 إخفاء التفاصيل')
                                     .replace('🔽 عرض التفاصيل والبنود', '🔼 إخفاء التفاصيل')
                                     .replace('عرض التفاصيل والبنود', 'إخفاء التفاصيل')
                                     .replace('عرض التفاصيل', 'إخفاء التفاصيل');
    });
};

window.tgCollapseAllCards = function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var cardBodies = container.querySelectorAll('.tg-card-body, [id^="wrBody_"], [id^="mrBody_"], [id^="mp-body-"], [id^="mp-emp-body-"]');
    cardBodies.forEach(function(body) {
        body.style.display = 'none';
    });

    var toggleBtns = container.querySelectorAll('.tg-toggle-btn');
    toggleBtns.forEach(function(btn) {
        btn.innerHTML = btn.innerHTML.replace('🔼 إخلاء التفاصيل', '🔻 عرض التفاصيل والبنود')
                                     .replace('🔼 إخفاء التفاصيل', '🔻 عرض التفاصيل والبنود')
                                     .replace('إخفاء التفاصيل', 'عرض التفاصيل والبنود')
                                     .replace('إخلاء التفاصيل', 'عرض التفاصيل والبنود');
    });
};

// ─── نافذة تأكيد عامة (Modal) ─────────────────────────────────────────────
// tgConfirmModal(title, bodyHtml, [{label, cls, onClick}, ...])
function tgConfirmModal(title, bodyHtml, buttons){
    tgCloseModal();
    var bd=document.createElement('div');
    bd.className='tg-modal-backdrop';
    bd.id='tgModalBackdrop';
    bd.onclick=function(e){ if(e.target===bd) tgCloseModal(); };
    var btnsHtml='';
    buttons.forEach(function(b,i){
        btnsHtml+='<button class="bt '+(b.cls||'bt-o')+'" id="tgModalBtn'+i+'">'+b.label+'</button>';
    });
    bd.innerHTML='<div class="tg-modal">'+
        '<div class="tg-modal-title">'+title+'</div>'+
        '<div class="tg-modal-body">'+bodyHtml+'</div>'+
        '<div class="tg-modal-actions">'+btnsHtml+'</div>'+
        '</div>';
    document.body.appendChild(bd);
    buttons.forEach(function(b,i){
        document.getElementById('tgModalBtn'+i).onclick=function(){ b.onClick&&b.onClick(); };
    });
}
function tgCloseModal(){
    var bd=document.getElementById('tgModalBackdrop');
    if(bd) bd.remove();
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────
// الصفحات التي يمكن للأدمن التقني الوصول إليها
var TECH_ALLOWED = ['pmgmt','tasksmgmt','livetrack','account','announcements'];

function hasUnsavedText() {
    var p = document.querySelector('.pg.a, .emp-pg.a');
    if(!p) return false;
    // فحص الحقول النصية ومساحات الكتابة فقط (تجاهل التواريخ والقوائم التي قد تُعبأ تلقائياً)
    var inputs = p.querySelectorAll('input[type="text"], input[type="email"], input[type="url"], textarea');
    for(var i=0; i<inputs.length; i++) {
        var el = inputs[i];
        if(el.readOnly || el.disabled || el.type === 'hidden') continue;
        // استثناء حقول البحث وحقول إنشاء الحسابات (لتجنب التعبئة التلقائية من المتصفح)
        if(el.id === 'globalTableFilter' || el.id === 'staffSearch' || el.classList.contains('staff-search') || el.classList.contains('global-table-filter') || 
           ['newAccName','newAccEmail','newAccPass','newAccJobTitle','pmTitle','pmDesc','tkTitle','tkDesc'].indexOf(el.id) > -1 && el.value.trim() === el.defaultValue) continue;
        
        // استثناء إضافي صريح لحقول الحسابات الجديدة
        if(['newAccName','newAccEmail','newAccPass','newAccJobTitle'].indexOf(el.id) > -1) continue;
        
        var val = el.value.trim();
        // لا نعتبر الحقل "غير محفوظ" إلا إذا كان يحتوي على نص حقيقي ومختلف عن القيمة الأصلية
        if(val !== '' && val !== el.defaultValue) {
            // استثناء إضافي للقيم الافتراضية المحددة برمجياً
            var def = el.getAttribute('data-default') || '';
            if(def && val === def.trim()) continue;
            return true;
        }
    }
    return false;
}
function clearUnsavedText() {
    var p = document.querySelector('.pg.a, .emp-pg.a');
    if(!p) return;
    var inputs = p.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]), textarea');
    for(var i=0; i<inputs.length; i++) {
        var el = inputs[i];
        if(!el.readOnly && !el.disabled) {
            el.value = el.getAttribute('data-default') || el.defaultValue || '';
        }
    }
}

window.tgHistory = [];
function tgGoBack(){
    if(window.tgHistory.length > 0){
        var prevId = window.tgHistory.pop();
        window._isGoingBack = true;
        go(prevId, null, false);
    }
}

function go(id, nav, force){
    // Removed hasUnsavedText check to prevent annoying popups
    // قيود الأدمن التقني
    if(TG_USER && TG_USER.role==='tech_admin' && TECH_ALLOWED.indexOf(id)===-1){
        tgConfirmModal('🔒 وصول محدود',
            'الأدمن التقني يمكنه فقط الوصول إلى صفحات الإدارة التقنية للمشاريع والمهام والمتابعة اللحظية.<br>تواصل مع الإدارة لو احتجت صلاحيات أعلى.',
            [{label:'حسناً', cls:'bt-p', onClick:tgCloseModal}]);
        return;
    }
    document.querySelectorAll(".S-i").forEach(function(e){e.classList.remove("a")});
    if(nav)nav.classList.add("a");
    else{var el=document.querySelector('.S-i[onclick*="\''+id+'\'"]');if(el)el.classList.add("a")}
    window._currentLoadedFormId = null;
    window._currentLoadedFormTitle = null;
    
    var currentActive = document.querySelector(".pg.a");
    var currentId = currentActive ? currentActive.id.replace('pg-', '') : null;
    if(currentId && currentId !== id && !window._isGoingBack) {
        if(currentId !== 'dash') { window.tgHistory.push(currentId); }
        else { window.tgHistory = ['dash']; }
    }
    window._isGoingBack = false;

    document.querySelectorAll(".pg").forEach(function(e){e.classList.remove("a")});
    document.getElementById("pg-"+id).classList.add("a");
    
    var backBtn = document.getElementById("tgBackBtn");
    if(backBtn){
        backBtn.style.display = (window.tgHistory.length > 0 && id !== 'dash') ? 'inline-flex' : 'none';
        if(id === 'dash') window.tgHistory = [];
    }

    document.getElementById("pT").innerText=T[id]||id;
    if(window.innerWidth<=900)document.getElementById("sb").classList.remove("opn");
    var c=document.getElementById("pg-"+id);
    if(id!=="dash"&&c.innerHTML.trim()===""){load(id,c);upCN();setD(c)}
    // Reset global table filter
    var gf = document.getElementById("globalTableFilter");
    if(gf) { gf.value = ""; tgFilterVisibleTables(""); }
        // Show/Hide top bar tools
    var formIds = ['gen','notice','warn','inv','exp','clr','res','promo','raise','contract','task','proj','sal','salrec','emp','leave','perm','delay','sendform','mexp'];
    var tableIds = ['la','lb','lc','ld','pmgmt','tasksmgmt','staff','wkreports','empdocs','att_live','att','archive','announcements','mexp','devres'];

    var tgTableTools = document.getElementById('tgTableTools');
    var tgFormTools = document.getElementById('tgFormTools');

    if(tgTableTools) tgTableTools.style.display = tableIds.indexOf(id) !== -1 ? 'flex' : 'none';
    if(tgFormTools) tgFormTools.style.display = formIds.indexOf(id) !== -1 ? 'flex' : 'none';
    
    if(typeof onPageChange === "function") onPageChange(id);
}

// ── Global Table Filter ──
function tgFilterVisibleTables(query) {
    var q = (query || "").toLowerCase().trim();
    var activePg = document.querySelector('.pg.a');
    if(!activePg) return;
    var tables = activePg.querySelectorAll('table.dt, table:not(.no-filter)');
    tables.forEach(function(tbl) {
        var rows = tbl.querySelectorAll('tbody tr, tr');
        rows.forEach(function(tr) {
            // Skip header rows
            if(tr.querySelector('th') && !tr.querySelector('td')) return;
            var text = tr.textContent.toLowerCase();
            if(q === "" || text.indexOf(q) > -1) {
                tr.style.display = '';
            } else {
                tr.style.display = 'none';
            }
        });
    });
}
// ── Global Table Sorter ──
function tgSortVisibleList(sortBy) {
    if(!sortBy) return;
    var activePg = document.querySelector('.pg.a') || document.querySelector('.emp-pg.a');
    if(!activePg) return;

    var lists = activePg.querySelectorAll('.pj-row, .staff-card, .emp-proj-card, table.dt tbody tr, table:not(.no-filter) tr');
    var containers = new Set();
    lists.forEach(function(el) { containers.add(el.parentNode); });

    containers.forEach(function(container) {
        var items = Array.prototype.slice.call(container.children).filter(function(el) {
            return el.classList.contains('pj-row') || el.classList.contains('staff-card') || el.classList.contains('emp-proj-card') || el.tagName === 'TR';
        });
        if(items.length === 0) return;
        
        var headers = [];
        var rows = [];
        items.forEach(function(el) {
            if(el.querySelector('th')) headers.push(el);
            else rows.push(el);
        });

        rows.sort(function(a,b) {
            var parts = sortBy.split('_');
            var sortKey = parts[0];
            var dir = parts[1];
            
            var valA = a.getAttribute('data-' + sortKey) || '';
            var valB = b.getAttribute('data-' + sortKey) || '';
            
            var numA = parseFloat(valA);
            var numB = parseFloat(valB);
            
            var res = 0;
            if(!isNaN(numA) && !isNaN(numB)) {
                res = numA - numB;
            } else {
                res = valA.localeCompare(valB);
            }
            return dir === 'desc' ? -res : res;
        });

        rows.forEach(function(el) { container.appendChild(el); });
    });
}
function tgFilterByEmployee(empName, rowClass) {
    var activePg = document.querySelector('.pg.a') || document.querySelector('.emp-pg.a');
    if(!activePg) return;
    var items = activePg.querySelectorAll('.' + rowClass);
    items.forEach(function(el) {
        if(!empName || el.getAttribute('data-emp') === empName) {
            el.style.setProperty('display', '', 'important');
        } else {
            el.style.setProperty('display', 'none', 'important');
        }
    });
}
function ts(b){var p=b.parentNode;p.querySelectorAll(".stb").forEach(function(x){x.classList.remove("a")});b.classList.add("a")}
function sct(c){c.parentNode.querySelectorAll(".ctc").forEach(function(x){x.classList.remove("sel")});c.classList.add("sel")}
function spr(p){p.parentNode.querySelectorAll(".ppl").forEach(function(x){x.classList.remove("a")});p.classList.add("a")}

// ─── Sidebar Search & Quick Nav ──────────────────────────────────────────
function tgToggleNavGroup(el) {
    var group = el.parentElement;
    group.classList.toggle('open');
}

function sbFilterNav(val){
    var v = (val||'').toLowerCase().trim();
    var groups = document.querySelectorAll('#sidebarNav .sb-group');
    var noRes = document.getElementById('sbNoResults');
    var hasAnyGlobal = false;
    
    if(!v) {
        groups.forEach(function(g){
            g.style.display = '';
            var items = g.querySelectorAll('.S-i');
            items.forEach(function(el){ el.style.display = ''; });
        });
        if(noRes) noRes.style.display = 'none';
        return;
    }
    
    groups.forEach(function(g){
        var items = g.querySelectorAll('.S-i');
        var hasAnyInGroup = false;
        items.forEach(function(el){
            var text = el.textContent.toLowerCase();
            if(text.indexOf(v) > -1) {
                el.style.display = '';
                hasAnyInGroup = true;
                hasAnyGlobal = true;
            } else {
                el.style.display = 'none';
            }
        });
        if(hasAnyInGroup) {
            g.style.display = '';
            g.classList.add('open');
        } else {
            g.style.display = 'none';
        }
    });
    
    if(noRes) noRes.style.display = hasAnyGlobal ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', function(){
    var sb = document.getElementById('sb');
    var btn = document.getElementById('sbScrollTop');
    if(sb && btn) {
        sb.addEventListener('scroll', function(){
            if(sb.scrollTop > 150) btn.classList.add('vis');
            else btn.classList.remove('vis');
        });
    }
});

// ─── Toast Notification Helper ────────────────────────────────────────────
function tgToast(msg, type, isPersistent, titleOverride){
    var container = document.getElementById('tg-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'tg-toast-container';
        document.body.appendChild(container);
    }
    
    var title = titleOverride || 'إشعار';
    var body = msg;
    var icon = '🔔';
    if(type === 'ok') icon = '✅';
    else if(type === 'err') icon = '❌';

    var msgParts = msg.split(' — ');
    if(msgParts.length > 1) {
        title = msgParts[0].replace('🔔 ', '').replace('✅ ', '').replace('❌ ', '');
        body = msgParts.slice(1).join(' — ');
    } else {
        body = msg.replace('🔔 ', '').replace('✅ ', '').replace('❌ ', '');
        if(!titleOverride) {
            title = type === 'ok' ? 'نجاح' : (type === 'err' ? 'خطأ' : 'تنبيه');
        }
    }

    var t=document.createElement('div');
    t.className='tg-toast tg-toast-'+(type||'info');
    
    var h = '<div class="tg-toast-icon">' + icon + '</div>';
    h += '<div class="tg-toast-content">';
    h += '<div class="tg-toast-title">' + (typeof escH === 'function' ? escH(title) : title) + '</div>';
    if(body) h += '<div class="tg-toast-body">' + (typeof escH === 'function' ? escH(body) : body) + '</div>';
    h += '</div>';
    h += '<div class="tg-toast-close" onclick="this.parentElement.remove()">✕</div>';
    if(!isPersistent) {
        h += '<div class="tg-toast-progress"></div>';
    }
    
    t.innerHTML = h;
    container.appendChild(t);
    
    if(!isPersistent) {
        setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 4000);
    }
    return t;
}

// ─── تقييد صلاحيات الأدمن التقني ────────────────────────────────────────
function applyTechAdminRestrictions(u){
    if(!u || u.role !== 'tech_admin') return;
    // أخفِ بنود الشريط الجانبي غير المسموح بها للأدمن التقني
    var allowed = TECH_ALLOWED;
    document.querySelectorAll('.sb-group').forEach(function(g){
        var items = g.querySelectorAll('.S-i');
        var hasVisible = false;
        items.forEach(function(el){
            var onclick = el.getAttribute('onclick') || '';
            var allowed_item = allowed.some(function(id){ 
                if(id === 'livetrack' && onclick.indexOf('goLiveTrack') > -1) return true;
                return onclick.indexOf("'"+id+"'")>-1||onclick.indexOf('"'+id+'"')>-1; 
            });
            if(!allowed_item && onclick.indexOf('tgLogout')===-1){ el.style.display='none'; }
            else { hasVisible = true; }
        });
        if(!hasVisible) g.style.display = 'none';
    });
}

// ─── إعادة ضبط النظام (للأدمن الرئيسي فقط) ───────────────────────────────
function resetSystem(){
    if(!TG_USER || TG_USER.role !== 'admin'){
        tgToast('هذه العملية للأدمن الرئيسي فقط.','err'); return;
    }
    tgConfirmModal(
        '⚠️ إعادة ضبط النظام',
        '<div style="color:var(--no);font-weight:700;margin-bottom:10px">تحذير: هذا الإجراء سيحذف كل البيانات الديناميكية بشكل نهائي.</div>'+
        '<div style="font-size:11px;color:var(--tx3);line-height:2">سيتم حذف: المشاريع · المهام · التقارير الأسبوعية · الإنجازات · الطلبات · رسائل الشات · التعليقات<br><strong>لن يتم حذف</strong> حسابات المستخدمين أو إعدادات النظام.</div>',
        [
            { label:'❌ إلغاء', cls:'bt-o', onClick: function(){} },
            { label:'🗑 تأكيد الحذف', cls:'bt-d', onClick: function(){
                var batch = db.batch();
                var collections = ['projects','tasks','weeklyReports','achievements','requests','chatMessages','projectComments','formRequests'];
                var proms = collections.map(function(col){
                    return db.collection(col).get().then(function(snap){
                        snap.forEach(function(doc){ batch.delete(doc.ref); });
                    });
                });
                Promise.all(proms).then(function(){ return batch.commit(); }).then(function(){
                    tgToast('✅ تم إعادة ضبط النظام بنجاح','ok');
                    loadDashboardSummary();
                }).catch(function(err){
                    tgToast('❌ تعذرت إعادة الضبط: '+err.message,'err');
                });
            }}
        ]
    );
}

function updTaskSigs(rb){
    var el=document.getElementById('task-approver-sig');
    if(!el)return;
    var isTech=rb.value==='tech';
    el.outerHTML=_sig(
        isTech?'المدير التقني':'المدير الإداري / مدير المشروعات',
        isTech?MGRS.tech:MGRS.admin,
        isTech?'التكليف التقني والمتابعة':'الموافقة والاعتماد',
        'task-approver-sig'
    );
}

function updGenSig(rb){
    var el=document.getElementById('gen-issuer-sig');
    if(!el)return;
    var map={admin:['المدير الإداري / مدير المشروعات',MGRS.admin],tech:['المدير التقني',MGRS.tech],exec:['المدير التنفيذي',MGRS.exec]};
    var v=map[rb.value]||map.admin;
    el.outerHTML=_sigFL(v[0],v[1],'اعتماد وإصدار','gen-issuer-sig');
}

function saveSt(){
    var n=document.getElementById("sn").value;
    if(n){CN=n;localStorage.setItem('tg_cn',CN);}
    MGRS.admin=(document.getElementById("sm_admin").value||'').trim();
    MGRS.exec =(document.getElementById("sm_exec").value||'').trim();
    MGRS.tech =(document.getElementById("sm_tech").value||'').trim();
    localStorage.setItem('tg_mgrs',JSON.stringify(MGRS));
    upCN();
    // Clear cached forms so names refresh on next visit
    document.querySelectorAll('.pg').forEach(function(p){
        if(p.id!=='pg-dash'&&p.id!=='pg-set')p.innerHTML='';
    });
    alert("✅ تم حفظ إعدادات الشركة والمديرين\nسيتم تحديث الأسماء عند فتح النماذج.");
}

function saveAppSettings() {
    var enabled = document.getElementById('chkAttEnabled').checked;
    var globalRemote = document.getElementById('chkGlobalRemote').checked;
    var geminiApi = document.getElementById('txtGeminiApi') ? document.getElementById('txtGeminiApi').value.trim() : (window._appSettingsCache ? window._appSettingsCache.geminiApiKey : '');
    db.collection('system').doc('appSettings').set({
        attendanceEnabled: enabled,
        globalRemoteMode: globalRemote,
        geminiApiKey: geminiApi
    }, {merge: true}).then(function() {
        window._appSettingsCache = window._appSettingsCache || {};
        window._appSettingsCache.attendanceEnabled = enabled;
        window._appSettingsCache.globalRemoteMode = globalRemote;
        window._appSettingsCache.geminiApiKey = geminiApi;
        alert('✅ تم حفظ إعدادات النظام بنجاح!');
    }).catch(function(err) {
        alert('❌ تعذر حفظ الإعدادات: ' + err.message);
    });
}

function upCN(){document.querySelectorAll(".dcn").forEach(function(e){e.innerText=CN})}
function resetSeq(){
    if(!confirm("⚠️ هل تريد تصفير كل أرقام التسلسل للمستندات؟\nسيبدأ ترقيم كل النماذج من 001 من جديد.\nلا يمكن التراجع عن هذا الإجراء."))return;
    var rm=[];
    for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('tg_seq_')===0)rm.push(k);}
    rm.forEach(function(k){localStorage.removeItem(k);});
    alert("✅ تم تصفير أرقام المستندات\nستبدأ كل النماذج من جديد بالرقم 001.");
}
// ─── قائمة الموظفين المشتركة (إدخال مرة واحدة → اختيار من دروب ليست) ──────
function refreshEmpDatalist(){
    var dl=document.getElementById('tgEmpDL');
    if(!dl)return;
    EMPLOYEES.sort(function(a,b){return a.localeCompare(b,'ar');});
    dl.innerHTML=EMPLOYEES.map(function(n){return '<option value="'+escH(n)+'"></option>';}).join('');
}
function saveEmployees(){
    localStorage.setItem('tg_employees',JSON.stringify(EMPLOYEES));
    refreshEmpDatalist();
}
function addEmployeeName(name){
    name=(name||'').trim();
    if(!name)return;
    if(EMPLOYEES.indexOf(name)===-1){
        EMPLOYEES.push(name);
        saveEmployees();
    }
}
function delEmployeeName(name){
    if(!confirm('حذف "'+name+'" من قائمة الموظفين؟'))return;
    var i=EMPLOYEES.indexOf(name);
    if(i>-1){EMPLOYEES.splice(i,1);saveEmployees();}
    renderEmpListSec();
}
function addEmpFromSettings(){
    var inp=document.getElementById('newEmpName');
    if(!inp)return;
    var name=(inp.value||'').trim();
    if(!name){inp.focus();return;}
    addEmployeeName(name);
    inp.value='';
    renderEmpListSec();
    inp.focus();
}
function empListSecHTML(){
    var h='<div class="set-sec" id="empListSec"><div class="set-sec-title">👥 قائمة الموظفين</div>';
    h+='<div class="set-hint">أضف اسم كل موظف هنا مرة واحدة، وبعدها سيظهر تلقائياً كخيار دروب ليست (Autocomplete) في كل حقول "اسم الموظف" بجميع النماذج — مع إمكانية الكتابة اليدوية أيضاً لأي اسم جديد.</div>';
    h+='<div class="fr fr2" style="margin-top:10px"><div class="fg" style="margin:0"><input type="text" id="newEmpName" placeholder="اكتب اسم الموظف الجديد..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();addEmpFromSettings();}"></div>'+
       '<button class="bt bt-p" style="align-self:flex-start" onclick="addEmpFromSettings()">➕ إضافة للقائمة</button></div>';
    if(EMPLOYEES.length){
        h+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">';
        EMPLOYEES.slice().sort(function(a,b){return a.localeCompare(b,'ar');}).forEach(function(n){
            h+='<div class="code-chip" style="display:flex;align-items:center;gap:6px"><span class="code-lbl">'+escH(n)+'</span>'+
               '<span onclick="delEmployeeName(\''+n.replace(/'/g,"\\'")+'\')" style="cursor:pointer;color:var(--no);font-weight:800" title="حذف">✕</span></div>';
        });
        h+='</div>';
    }else{
        h+='<div class="set-hint" style="margin-top:10px">لا يوجد أي موظف في القائمة بعد.</div>';
    }
    h+='</div>';
    return h;
}
function renderEmpListSec(){
    var el=document.getElementById('empListSec');
    if(!el)return;
    el.outerHTML=empListSecHTML();
}

// ─── نظرة عامة سريعة على لوحة التحكم (تكامل حي بين الموظفين/المشاريع/الطلبات) ──
function loadDashboardSummary(){
    var box=document.getElementById('dashSummary');
    if(!box)return;
    Promise.all([
        db.collection('users').where('role','in',['employee','tech_admin']).get(),
        db.collection('projects').get(),
        db.collection('requests').where('status','==','pending').get(),
        db.collection('tasks').get(),
        db.collection('attendance_logs').where('date','>=',new Date().toISOString().split('T')[0].substring(0,7)+'-01').get()
    ]).then(function(res){
        var employees=res[0].docs.map(function(d){return Object.assign({uid:d.id},d.data())});
        var projects=res[1].docs.map(function(d){return Object.assign({id:d.id},d.data())});
        var pendingCount=res[2].size;
        var tasks=res[3].docs.map(function(d){return Object.assign({id:d.id},d.data())});
        var attLogs=res[4].docs.map(function(d){return d.data()});

        // حساب النقاط لكل موظف للمتصدرين
        employees.forEach(function(emp){
            emp.projects = projects.filter(function(p){ return p.assignees && p.assignees.indexOf(emp.uid)>-1; });
            emp.tasks = tasks.filter(function(t){ return t.assignedTo === emp.uid; });
            emp.attendance = attLogs.filter(function(l){ return l.uid === emp.uid; });
            emp.achievementsCount = 0; // سيتم تحديثه في صفحة الموظفين، هنا نعتمد على المهام والحضور
            emp.weeklyReportsCount = 0;
            emp.perf = calculatePerformanceScore(emp);
        });

        var top3 = employees.sort(function(a,b){ return b.perf.total - a.perf.total; }).slice(0,3);

        var empCount=res[0].size, projCount=res[1].size;
        var h = '<div class="DC" onclick="go(\'staff\')" style="cursor:pointer"><div class="di-wrap"><div class="di">👥</div></div><div class="dt2">'+empCount+' موظف</div><div class="dd">إجمالي حسابات الموظفين المسجّلة</div></div>'+
            '<div class="DC" onclick="go(\'pmgmt\')" style="cursor:pointer"><div class="di-wrap"><div class="di">📁</div></div><div class="dt2">'+projCount+' مشروع</div><div class="dd">إجمالي المشاريع الحالية</div></div>'+
            '<div class="DC" onclick="go(\'staff\')" style="cursor:pointer'+(pendingCount?';border:1px solid var(--no);box-shadow:0 4px 12px rgba(239,68,68,0.15)':'')+'"><div class="di-wrap"><div class="di" '+(pendingCount?'style="background:#fef2f2"':'')+'>⏳</div>'+(pendingCount?'<span class="badge-new" style="background:#fef2f2;color:#ef4444;border-color:rgba(239,68,68,0.2)">عاجل</span>':'')+'</div><div class="dt2" '+(pendingCount?'style="color:#ef4444"':'')+'>'+pendingCount+' طلب معلّق</div><div class="dd">بانتظار موافقة أو رفض الأدمن</div></div>';
        
        box.innerHTML = h;

        // إضافة ويدجت المتصدرين
        var dashWrap = document.querySelector('.dash-wrap');
        if(dashWrap){
            var oldRank = document.getElementById('topPerformersWidget');
            if(oldRank) oldRank.remove();
            
            var rankH = '<div class="dash-group" id="topPerformersWidget" style="margin-top:20px">'+
                '<div class="dash-sec-title"><div class="di">🏆</div> الموظفون الأكثر التزاماً (هذا الشهر)</div>'+
                '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px">';
            
            top3.forEach(function(emp, i){
                var medals = ['🥇','🥈','🥉'];
                rankH += '<div class="top-performer-card" onclick="tgOpenEmployeeProfile(\''+emp.uid+'\')">'+
                    '<div class="top-rank">'+(i+1)+'</div>'+
                    '<div class="top-info">'+
                        '<div class="top-name">'+escH(emp.name||emp.email)+'</div>'+
                        '<div class="top-score-val">الأداء العام: '+emp.perf.total+'%</div>'+
                        '<div class="perf-stars">'+renderStars(emp.perf.stars)+'</div>'+
                    '</div>'+
                    '<div class="top-medal">'+medals[i]+'</div>'+
                '</div>';
            });
            rankH += '</div></div>';
            dashWrap.insertAdjacentHTML('afterbegin', rankH);
        }

    }).catch(function(err){ console.error(err); box.innerHTML=''; });
    // بدء مراقبة إشعارات الأدمن من الموظفين
    startAdminNotifications();
    // إخفاء عناصر القائمة للأدمن المساعد
    applyAssistantAdminRestrictions();
}

function calculatePerformanceScore(emp){
    var score = { tasks:0, projects:0, attendance:0, engagement:0, total:0, stars:0 };
    
    // 1. المهام (40%)
    if(emp.tasks && emp.tasks.length){
        var comp = emp.tasks.filter(function(t){ return t.status==='completed'; }).length;
        score.tasks = Math.round((comp / emp.tasks.length) * 40);
    }
    
    // 2. المشاريع (20%)
    if(emp.projects && emp.projects.length){
        var avg = emp.projects.reduce(function(s,p){
            var pm=(p.progressMap&&p.progressMap[emp.uid])?p.progressMap[emp.uid].progress:0;
            return s + (pm||0);
        },0) / emp.projects.length;
        score.projects = Math.round((avg / 100) * 20);
    }
    
    // 3. الحضور (30%)
    // نفترض 22 يوم عمل في الشهر كهدف
    if(emp.attendance && emp.attendance.length){
        var days = new Set(emp.attendance.map(function(l){ return l.date; })).size;
        score.attendance = Math.round(Math.min(30, (days / 22) * 30));
    }
    
    // 4. التفاعل (10%)
    var ach = (emp.achievements?emp.achievements.length:0) * 2;
    var rep = (emp.weeklyReports?emp.weeklyReports.length:0) * 1;
    score.engagement = Math.min(10, ach + rep);
    
    score.total = score.tasks + score.projects + score.attendance + score.engagement;
    score.stars = Math.max(1, Math.ceil(score.total / 20)); // 1-5 نجوم
    return score;
}

function renderStars(count){
    var s=''; for(var i=0;i<5;i++) s += (i<count?'★':'☆');
    return s;
}

// ─── تقييد القائمة الجانبية للأدمن المساعد ──────────────────────────────
function applyAssistantAdminRestrictions(){
    if(!TG_USER || TG_USER.role !== 'tech_admin') return;
    // إخفاء كل عناصر القائمة التي لا علاقة لها بالمشاريع
    document.querySelectorAll('.S-n .S-i').forEach(function(el){
        var onclick = el.getAttribute('onclick') || '';
        var allowed = TECH_ALLOWED.some(function(id){ return onclick.indexOf("'"+id+"'") > -1; });
        if(!allowed && onclick.indexOf('tgLogout') === -1) {
            el.style.display = 'none';
        }
    });
    document.querySelectorAll('.S-n .S-s').forEach(function(el){
        // إخفاء الفواصل التي لا يتبعها عناصر ظاهرة
        var next = el.nextElementSibling;
        var hasVisible = false;
        while(next && !next.classList.contains('S-s')){
            if(next.style.display !== 'none') { hasVisible = true; break; }
            next = next.nextElementSibling;
        }
        if(!hasVisible) el.style.display = 'none';
    });
    // عرض رسالة ترحيب مخصصة
    var subEl = document.querySelector('.S-h .sub');
    if(subEl) subEl.textContent = 'أدمن تقني — إدارة المشاريع';
}

// ─── إشعارات الأدمن اللحظية من الموظفين (طلبات + تقارير + مشاريع جديدة) ───
var _adminNotifUnsub = null;
var _adminNotifAudioCtx = null;
var _adminNotifAudioUnlocked = false;
var _adminNotifInitialDone = false;

function startAdminNotifications(){
    if(_adminNotifUnsub) return;
    _adminNotifUnsub = true; // Prevent multiple executions
    // فك قفل الصوت عند أول تفاعل
    var unlockFn = function(){
        if(_adminNotifAudioUnlocked) return;
        try{
            _adminNotifAudioCtx = _adminNotifAudioCtx || new (window.AudioContext||window.webkitAudioContext)();
            if(_adminNotifAudioCtx.state==='suspended') _adminNotifAudioCtx.resume();
            _adminNotifAudioUnlocked = true;
        }catch(e){}
        document.removeEventListener('click', unlockFn);
        document.removeEventListener('keydown', unlockFn);
    };
    document.addEventListener('click', unlockFn);
    document.addEventListener('keydown', unlockFn);

    // مراقبة الطلبات الجديدة (requests)
    var lastReqTime = Date.now();
    db.collection('requests').orderBy('createdAt','desc').limit(30)
        .onSnapshot(function(snap){
            if(!_adminNotifInitialDone){ _adminNotifInitialDone=true; return; }
            var hasNew = snap.docChanges().some(function(ch){
                if(ch.type !== 'added') return false;
                var d = ch.doc.data();
                var t = (d.createdAt && d.createdAt.toMillis) ? d.createdAt.toMillis() : 0;
                return t > lastReqTime;
            });
            if(hasNew){
                lastReqTime = Date.now();
                playAdminNotif();
                incrementAdminBadge('notif-req-badge', 'notif-req-badge-sb');
                if(typeof tgRefreshStaffIfOpen === 'function') tgRefreshStaffIfOpen();
                // Push Notification للأدمن
                if(typeof tgShowNotification === 'function'){
                    tgShowNotification('📨 طلب جديد', 'وصلك طلب جديد من أحد الموظفين.');
                }
            }
        });

    function tgRefreshStaffIfOpen(){
        var p = document.getElementById('pg-staff');
        if(p && p.classList.contains('a') && typeof loadStaffOverview === 'function') {
            loadStaffOverview();
        }
    }

    // مراقبة التقارير الأسبوعية الجديدة
    var lastWkrTime = Date.now();
    db.collection('weeklyReports').orderBy('createdAt','desc').limit(30)
        .onSnapshot(function(snap){
            snap.docChanges().forEach(function(ch){
                if(ch.type !== 'added') return;
                var d = ch.doc.data();
                var t = (d.createdAt && d.createdAt.toMillis) ? d.createdAt.toMillis() : 0;
                if(t > lastWkrTime){
                    lastWkrTime = Date.now();
                    playAdminNotif();
                    incrementAdminBadge('notif-wkr-badge', 'notif-wkr-badge-sb');
                    tgRefreshStaffIfOpen();
                    // Push Notification للأدمن
                    if(typeof tgShowNotification === 'function'){
                        tgShowNotification('📝 تقرير أسبوعي جديد', 'تم إرسال تقرير أسبوعي جديد من موظف.');
                    }
                }
            });
        });
}

function playAdminNotif(){
    try{
        _adminNotifAudioCtx = _adminNotifAudioCtx || new (window.AudioContext||window.webkitAudioContext)();
        if(_adminNotifAudioCtx.state==='suspended') _adminNotifAudioCtx.resume();
        var ctx = _adminNotifAudioCtx;
        var now = ctx.currentTime;
        // نغمتان متتاليتان: صول + دو
        _adminTone(ctx, 784.00, now,       0.18, 0.14);
        _adminTone(ctx, 523.25, now+0.15,  0.22, 0.18);
    }catch(e){}
}
function _adminTone(ctx, freq, start, dur, vol){
    var osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type='sine'; osc.frequency.value=freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(vol, start+0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start+dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(start); osc.stop(start+dur+0.05);
}
function incrementAdminBadge(badgeId, sbBadgeId){
    [badgeId, sbBadgeId].forEach(function(id){
        var el = document.getElementById(id);
        if(!el) return;
        var cur = parseInt(el.textContent) || 0;
        el.textContent = String(cur + 1);
        el.style.display = 'flex';
    });
}
function clearAdminBadge(badgeId, sbBadgeId){
    [badgeId, sbBadgeId].forEach(function(id){
        var el = document.getElementById(id);
        if(!el) return;
        el.textContent = '0';
        el.style.display = 'none';
    });
}

// ─── متابعة الموظفين (بيانات حية من Firebase Firestore) ──────────────────
function loadStaffOverview(){
    var box=document.getElementById('staffList');
    if(!box)return;
    db.collection('users').where('role','in',['employee','tech_admin']).get().then(function(snap){
        if(snap.empty){
            box.innerHTML='<div class="empty-hint">لا يوجد موظفون مسجّلون بعد. أنشئ أول حساب من الأعلى.</div>';
            return;
        }
        var employees=[];
        snap.forEach(function(doc){employees.push(Object.assign({uid:doc.id},doc.data()));});
        // مزامنة قائمة أسماء الموظفين الحقيقيين (حسابات الدخول) مع قائمة الأوتوكومبليت في كل النماذج
        employees.forEach(function(emp){ if(emp.name) addEmployeeName(emp.name); });
        renderEmpListSec();
        var proms=employees.map(function(emp){
            return Promise.all([
                db.collection('projects').where('assignees','array-contains',emp.uid).get(),
                db.collection('achievements').where('uid','==',emp.uid).get(),
                db.collection('requests').where('uid','==',emp.uid).get(),
                db.collection('weeklyReports').where('uid','==',emp.uid).get(),
                db.collection('tasks').where('assignedTo','==',emp.uid).get(),
                db.collection('attendance_logs').where('uid','==',emp.uid).get()
            ]).then(function(res){
                emp.projects=res[0].docs.map(function(d){return Object.assign({id:d.id},d.data());});
                emp.achievements=res[1].docs.map(function(d){return Object.assign({id:d.id},d.data());})
                    .sort(function(a,b){return (a.date<b.date)?1:-1;});
                emp.requests=res[2].docs.map(function(d){return Object.assign({id:d.id},d.data());})
                    .sort(function(a,b){
                        var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
                        var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
                        return bm-am;
                    });
                emp.weeklyReports=res[3].docs.map(function(d){return Object.assign({id:d.id},d.data());})
                    .sort(function(a,b){return (a.weekStart<b.weekStart)?1:-1;});
                emp.tasks=res[4].docs.map(function(d){return Object.assign({id:d.id},d.data());});
                emp.attendance=res[5].docs.map(function(d){return d.data();});
                
                emp.perf = calculatePerformanceScore(emp);
                return emp;
            });
        });
        Promise.all(proms).then(renderStaffList).catch(function(err){
            box.innerHTML='<div class="empty-hint" style="color:var(--no)">تعذر تحميل بيانات المشاريع/الطلبات: '+escH(err.message)+'</div>';
        });
    }).catch(function(err){
        box.innerHTML='<div class="empty-hint" style="color:var(--no)">تعذر تحميل بيانات الموظفين: '+escH(err.message)+'</div>';
    });
}
function badgeClassForStatus(s){
    if(s==='مكتمل')return 'badge-done';
    if(s==='جاري العمل')return 'badge-progress';
    return '';
}
function badgeClassForReq(s){
    if(s==='approved')return 'badge-approved';
    if(s==='rejected')return 'badge-rejected';
    return 'badge-pending';
}
function reqStatusLabel(s){
    if(s==='approved')return 'موافق عليه';
    if(s==='rejected')return 'مرفوض';
    return 'قيد المراجعة';
}
function renderStaffList(list){
    var box=document.getElementById('staffList');
    if(!box)return;
    window._staffEmpCache=list;
    var countEl=document.getElementById('staffCount');
    if(countEl)countEl.textContent=list.length+' موظف';
    var h='';
    list.forEach(function(emp,idx){
        var pending=emp.requests.filter(function(r){return r.status==='pending';}).length;
        var avgProg=emp.projects.length?Math.round(emp.projects.reduce(function(s,p){
            var pm=(p.progressMap&&p.progressMap[emp.uid])?p.progressMap[emp.uid].progress:0;
            return s+(pm||0);
        },0)/emp.projects.length):0;
        var searchKey=((emp.name||'')+' '+(emp.email||'')).toLowerCase();
        h+='<div class="staff-card'+(emp.disabled?' is-disabled':'')+'" id="staffCard'+idx+'" data-search="'+escH(searchKey)+'">';
        h+='<div class="staff-card-h" onclick="toggleStaffCard('+idx+')">'+
           '<div><div class="staff-name-row"><span class="staff-name">'+escH(emp.name||emp.email)+'</span>'+
           (emp.jobTitle?'<span class="badge" style="background:var(--gd);color:#1b2a4a">'+escH(emp.jobTitle)+'</span>':'')+
           (emp.disabled?'<span class="badge badge-disabled">🚫 معطّل</span>':'<span class="badge badge-active">✅ نشط</span>')+
           '<span class="perf-score" title="تقييم الأداء العام">🏆 '+emp.perf.total+'%</span>'+
           '</div><div class="staff-email">'+escH(emp.email||'')+'</div>'+
           '<div class="perf-stars">'+renderStars(emp.perf.stars)+'</div>'+
           '</div>'+
           '<div class="staff-stats">'+
           '<span class="staff-stat">📁 '+emp.projects.length+' مشروع</span>'+
           '<span class="staff-stat">📊 متوسط تقدم '+avgProg+'%</span>'+
           (emp.role === 'tech_admin' ? '' :
               '<span class="staff-stat">📆 '+emp.weeklyReports.length+' تقرير أسبوعي</span>'+
               '<span class="staff-stat">🏆 '+emp.achievements.length+' إنجاز</span>'+
               (pending?('<span class="staff-stat pending">⏳ '+pending+' طلب معلّق</span>'):'<span class="staff-stat">✅ لا طلبات معلّقة</span>')
           )+
           '</div></div>';
        h+='<div class="staff-card-body">';

        h+='<div class="staff-actions-row">'+
           '<button class="bt bt-g" onclick="event.stopPropagation();tgOpenEmployeeProfile(\''+emp.uid+'\')">👤 عرض البروفايل</button>'+
           '<button class="bt bt-o" onclick="event.stopPropagation();toggleEmpNameEdit('+idx+')">✏️ تعديل الاسم</button>'+
           '<button class="bt bt-o" onclick="event.stopPropagation();toggleEmpJobEdit('+idx+')">🏷 تعديل المسمى الوظيفي</button>'+
           '<button class="bt bt-o" onclick="event.stopPropagation();toggleEmpDeptPhoneEdit('+idx+')">☎️ الإدارة والهاتف</button>'+
           '<button class="bt '+(emp.chatAccess===false?'bt-p':'bt-o')+'" onclick="event.stopPropagation();tgToggleEmpChatAccess(\''+emp.uid+'\','+(emp.chatAccess!==false)+')">'+
           (emp.chatAccess===false?'💬 السماح بالشات':'💬 منع الشات')+'</button>'+
           '<button class="bt '+(emp.disabled?'bt-p':'bt-o')+'" onclick="event.stopPropagation();toggleEmpDisabled(\''+emp.uid+'\','+(!!emp.disabled)+')">'+
           (emp.disabled?'✅ إعادة تفعيل الحساب':'🚫 تعطيل الحساب')+'</button>'+
           '<button class="bt bt-d" onclick="event.stopPropagation();openDeleteEmpModal(\''+emp.uid+'\','+idx+')">🗑 حذف الموظف</button>'+
           '</div>'+
           '<div class="emp-inline-edit" id="empNameEdit'+idx+'" style="display:none">'+
           '<input type="text" id="empNameInput\'+idx+\'" value="\'+escH(emp.baseName||emp.name||\'\')+\'">'+
           '<button class="bt bt-p" onclick="saveEmpName(\''+emp.uid+'\','+idx+')">💾 حفظ</button>'+
           '<span id="empNameMsg'+idx+'" style="font-size:10.5px"></span>'+
           '</div>'+
           '<div class="emp-inline-edit" id="empJobEdit'+idx+'" style="display:none">'+
           '<input type="text" id="empJobInput'+idx+'" value="'+escH(emp.jobTitle||'')+'" placeholder="مثلاً: مصمم جرافيك">'+
           '<button class="bt bt-p" onclick="saveEmpJob(\''+emp.uid+'\','+idx+')">💾 حفظ</button>'+
           '<span id="empJobMsg'+idx+'" style="font-size:10.5px"></span>'+
           '</div>';

        h+='<div class="staff-sub-title">📁 المشاريع</div>';
        if(emp.projects.length){
            emp.projects.forEach(function(p){
                var pm=(p.progressMap&&p.progressMap[emp.uid])||{progress:0,status:'لم يبدأ',note:''};
                h+='<div class="pj-row"><div class="pj-t">'+escH(p.title||'بدون عنوان')+'</div>'+
                   (p.description?'<div class="pj-meta">'+tgMakeExpandable(p.description, 120)+'</div>':'')+
                   '<div class="pj-bar"><div class="pj-bar-in" style="width:'+(pm.progress||0)+'%"></div></div>'+
                   '<div class="pj-meta">الحالة: <span class="badge '+badgeClassForStatus(pm.status)+'">'+escH(pm.status||'لم يبدأ')+'</span> · التقدم: '+(pm.progress||0)+'%'+(pm.note?(' · ملاحظة: '+escH(pm.note)):'')+'</div>'+
                   '</div>';
            });
        }else h+='<div class="empty-hint">لا توجد مشاريع مُسندة حالياً.</div>';

        if(emp.role !== 'tech_admin'){
            h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">';
            h+='<div class="staff-sub-title" style="margin:0;border:none">📆 التقارير الأسبوعية</div>';
            if(emp.weeklyReports.length) h+='<button class="bt bt-d" style="padding:4px 10px;font-size:10px" onclick="event.stopPropagation();tgDeleteAllRecords(\'weeklyReports\', \'تقارير الموظف\', \'uid\', \''+emp.uid+'\', loadStaffOverview)">🗑 حذف الكل</button>';
            h+='</div>';
            if(emp.weeklyReports.length){
                window._staffWkrCache=window._staffWkrCache||{};
                window._staffWkrCache[idx]=emp.weeklyReports;
                emp.weeklyReports.forEach(function(r,ri){
                    var waMsg = encodeURIComponent(
                        'التقرير الأسبوعي - ' + (emp.name||emp.email||'') + '\n' +
                        'الأسبوع: ' + (r.weekStart||'') + '\n' +
                        '---\n' + (r.content||'')
                    );
                    h+='<div class="ac-row"><div class="ac-t">أسبوع '+escH(r.weekStart||'')+
                       ' <button class="bt bt-o" style="padding:2px 8px;font-size:10px;margin-right:8px" onclick="printWeeklyReportDoc(window._staffEmpCache['+idx+'],window._staffWkrCache['+idx+']['+ri+'])">🖨 طباعة</button>'+
                       ' <a href="https://wa.me/?text='+waMsg+'" target="_blank" class="bt bt-g" style="padding:2px 8px;font-size:10px;margin-right:8px;display:inline-flex;align-items:center;gap:4px;text-decoration:none">📲 واتساب</a></div>'+
                       (r.content?'<div class="ac-meta">'+tgMakeExpandable(r.content, 120)+'</div>':'')+'</div>';
                });
            }else h+='<div class="empty-hint">لم يُرسل الموظف أي تقرير أسبوعي بعد.</div>';

            h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">';
            h+='<div class="staff-sub-title" style="margin:0;border:none">🏆 الإنجازات</div>';
            if(emp.achievements.length) h+='<button class="bt bt-d" style="padding:4px 10px;font-size:10px" onclick="event.stopPropagation();tgDeleteAllRecords(\'achievements\', \'إنجازات الموظف\', \'uid\', \''+emp.uid+'\', loadStaffOverview)">🗑 حذف الكل</button>';
            h+='</div>';
            if(emp.achievements.length){
                window._staffAchCache=window._staffAchCache||{};
                window._staffAchCache[idx]=emp.achievements;
                emp.achievements.forEach(function(a,ai){
                    h+='<div class="ac-row"><div class="ac-t">'+escH(a.title||'')+
                       ' <button class="bt bt-o" style="padding:2px 8px;font-size:10px;margin-right:8px" onclick="printAchievementDoc(window._staffEmpCache['+idx+'],window._staffAchCache['+idx+']['+ai+'])">🖨 طباعة</button></div>'+
                       (a.description?'<div class="ac-meta">'+tgMakeExpandable(a.description, 120)+'</div>':'')+
                       (a.date?'<div class="ac-meta">📅 '+escH(a.date)+'</div>':'')+'</div>';
                });
            }else h+='<div class="empty-hint">لا توجد إنجازات مسجّلة بعد.</div>';

            h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">';
            h+='<div class="staff-sub-title" style="margin:0;border:none">📨 الطلبات</div>';
            if(emp.requests.length) h+='<button class="bt bt-d" style="padding:4px 10px;font-size:10px" onclick="event.stopPropagation();tgDeleteAllRecords(\'requests\', \'طلبات الموظف\', \'uid\', \''+emp.uid+'\', loadStaffOverview)">🗑 حذف الكل</button>';
            h+='</div>';
            if(emp.requests.length){
                window._staffReqCache=window._staffReqCache||{};
                window._staffReqCache[idx]=emp.requests;
                emp.requests.forEach(function(r,qi){
                    var attachHtml = '';
                    if(r.fileUrl && r.fileType){
                        if(r.fileType.indexOf('image/')===0){
                            attachHtml = '<div style="margin-top:6px"><a href="'+r.fileUrl+'" target="_blank"><img src="'+r.fileUrl+'" style="max-width:140px;max-height:100px;border-radius:6px;display:block"></a></div>';
                        } else if(r.fileType.indexOf('video/')===0){
                            attachHtml = '<div style="margin-top:6px"><video src="'+r.fileUrl+'" controls style="max-width:180px;border-radius:6px"></video></div>';
                        } else {
                            attachHtml = '<div style="margin-top:6px"><a href="'+r.fileUrl+'" target="_blank" style="color:var(--tx);font-weight:700;text-decoration:underline">📎 '+escH(r.fileName||'ملف مرفق')+'</a></div>';
                        }
                    }
                    h+='<div class="rq-row"><div class="rq-t">'+escH(r.type||'طلب')+' <span class="badge '+badgeClassForReq(r.status)+'">'+reqStatusLabel(r.status)+'</span>'+
                       (r.type !== 'طلب نموذج' ? ' <button class="bt bt-o" style="padding:2px 8px;font-size:10px;margin-right:8px" onclick="printRequestDoc(window._staffEmpCache['+idx+'],window._staffReqCache['+idx+']['+qi+'])">🖨 طباعة</button>' : '') + '</div>'+
                       (r.details?'<div class="pj-meta">'+tgMakeExpandable(r.details, 120)+'</div>':'')+
                       (r.fromDate?('<div class="pj-meta">من '+escH(r.fromDate)+(r.toDate?(' إلى '+escH(r.toDate)):'')+'</div>'):'')+
                       (r.reviewedBy?('<div class="pj-meta">تمت المراجعة بواسطة: '+escH(r.reviewedBy)+'</div>'):'')+
                       (function(){
                           if(!r.dynamicData) return '';
                           var dh = '<div style="margin-top:10px;padding:10px;background:rgba(0,0,0,0.03);border-radius:6px;font-size:12px;">';
                           var tpl = window.FS_TEMPLATES && r.formTemplateId ? window.FS_TEMPLATES[r.formTemplateId] : null;
                           var fieldLabels = {};
                           if(tpl && tpl.fields) { tpl.fields.forEach(function(f){ fieldLabels[f.id] = f.label; }); }
                           for(var k in r.dynamicData){
                               var v = r.dynamicData[k];
                               if(v === true) v = 'نعم / تم';
                               if(v === false) v = 'لا';
                               var lbl = fieldLabels[k] || k;
                               if(lbl === 'chk1') lbl = 'تسليم العهدة المالية';
                               if(lbl === 'chk2') lbl = 'تسليم العهدة العينية';
                               if(lbl === 'chk3') lbl = 'تسليم المستندات والملفات';
                               if(lbl === 'chk4') lbl = 'إنهاء المهام المعلقة';
                               dh += '<div style="margin-bottom:4px;display:flex;"><span style="color:var(--tx3);min-width:120px;padding-left:10px;">' + escH(lbl) + ':</span> <b style="white-space:pre-wrap;">' + escH(v) + '</b></div>';
                           }
                           dh += '</div>';
                           return dh;
                       })()+
                       attachHtml+
                       (r.status==='pending'?('<div class="rq-actions" style="margin-top:8px">'+
                           (r.type==='طلب نموذج'?'<button class="bt bt-o" style="border-color:var(--pr);color:var(--pr);margin-left:8px" onclick="goSendForm(document.querySelector(\'[onclick*=\\\'goSendForm\\\']\'), \''+emp.uid+'\', window._staffReqCache['+idx+']['+qi+'].details)">📨 إرسال نموذج للموظف</button>':'')+
                           '<button class="bt bt-p" onclick="reviewRequest(\''+r.id+'\',\'approved\')">✔ موافقة</button><button class="bt bt-d" onclick="reviewRequest(\''+r.id+'\',\'rejected\')">✕ رفض</button></div>'):'')+
                       '</div>';
                });
            }else h+='<div class="empty-hint">لا توجد طلبات بعد.</div>';
        }

        h+='</div></div>';
    });
    box.innerHTML=h;
}
function toggleStaffCard(idx){
    var c=document.getElementById('staffCard'+idx);
    if(c)c.classList.toggle('open');
}
function filterStaffCards(){
    var q=(document.getElementById('staffSearch').value||'').trim().toLowerCase();
    var visible=0;
    document.querySelectorAll('#staffList .staff-card').forEach(function(c){
        var match=!q||(c.getAttribute('data-search')||'').indexOf(q)>-1;
        c.style.display=match?'':'none';
        if(match)visible++;
    });
    var countEl=document.getElementById('staffCount');
    if(countEl)countEl.textContent=visible+' موظف'+(q?(' من '+(window._staffEmpCache?window._staffEmpCache.length:0)):'');
}
function openPendingRequestsModal() {
    var modal = document.getElementById('tgProfileModal');
    if(!modal) return;
    modal.innerHTML = '<div class="profile-modal-in" style="max-width:800px"><div class="profile-hdr"><div style="font-size:18px;font-weight:bold;margin-bottom:10px">📨 الطلبات قيد الانتظار</div><button class="bt" onclick="tgCloseProfile()" style="background:var(--bg);color:var(--tx)">✕ إغلاق</button></div><div id="pendingReqsBody" style="padding:20px"><div class="empty-hint">⏳ جارٍ التحميل...</div></div></div>';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    db.collection('requests').where('status','==','pending').get().then(function(snap){
        if(snap.empty){
            document.getElementById('pendingReqsBody').innerHTML = '<div class="empty-hint">لا توجد طلبات معلقة حالياً.</div>';
            return;
        }
        var h = '<div class="profile-grid" style="grid-template-columns:1fr">';
        snap.forEach(function(doc){
            var r = Object.assign({id:doc.id}, doc.data());
            var empName = window._staffEmpCache ? (window._staffEmpCache.find(function(e) { return e.uid === r.uid; }) || {}).name || r.uid : r.uid;
            
            var dh = '';
            if(r.dynamicData) {
                 var tpl = window.FS_TEMPLATES && r.formTemplateId ? window.FS_TEMPLATES[r.formTemplateId] : null;
                 var fieldLabels = {};
                 if(tpl && tpl.fields) { tpl.fields.forEach(function(f){ fieldLabels[f.id] = f.label; }); }
                 dh = '<div style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.04);border-radius:6px;font-size:11px;">';
                 for(var k in r.dynamicData){
                     var v = r.dynamicData[k];
                     if(v === true) v = 'نعم / تم';
                     if(v === false) v = 'لا';
                     var lbl = fieldLabels[k] || k;
                     if(lbl === 'chk1') lbl = 'تسليم العهدة المالية';
                     if(lbl === 'chk2') lbl = 'تسليم العهدة العينية';
                     if(lbl === 'chk3') lbl = 'تسليم المستندات والملفات';
                     if(lbl === 'chk4') lbl = 'إنهاء المهام المعلقة';
                     dh += '<div style="margin-bottom:3px;"><span style="color:var(--tx3);display:inline-block;width:100px;">' + escH(lbl) + ':</span> <b style="white-space:pre-wrap;">' + escH(v) + '</b></div>';
                 }
                 dh += '</div>';
            }
            
            var attachHtml = '';
            if(r.fileUrl && r.fileType){
                if(r.fileType.indexOf('image/')===0){ attachHtml = '<div style="margin-top:6px"><a href="'+r.fileUrl+'" target="_blank"><img src="'+r.fileUrl+'" style="max-width:140px;max-height:100px;border-radius:6px;display:block"></a></div>'; }
                else if(r.fileType.indexOf('video/')===0){ attachHtml = '<div style="margin-top:6px"><video src="'+r.fileUrl+'" controls style="max-width:180px;border-radius:6px"></video></div>'; }
                else { attachHtml = '<div style="margin-top:6px"><a href="'+r.fileUrl+'" target="_blank" style="color:var(--tx);font-weight:700;text-decoration:underline">📎 '+escH(r.fileName||'ملف مرفق')+'</a></div>'; }
            }

            h += '<div class="rq-row" style="background:var(--bg);padding:12px;border-radius:10px;margin-bottom:8px;">' +
                 '  <div class="rq-t" style="font-weight:700;display:flex;justify-content:space-between;">' + 
                 '    <span>' + escH(r.type || 'طلب') + '</span>' +
                 '    <span style="font-size:12px;color:var(--tx3)">👤 ' + escH(empName) + '</span>' +
                 '  </div>' +
                 (r.details ? ('  <div class="pj-meta" style="margin-top:4px;">' + escH(r.details) + '</div>') : '') +
                 (r.fromDate?('<div class="pj-meta" style="margin-top:4px;">من '+escH(r.fromDate)+(r.toDate?(' إلى '+escH(r.toDate)):'')+'</div>'):'')+
                 dh + attachHtml +
                 '  <div class="rq-actions" style="margin-top:8px">' +
                 '    <button class="bt bt-p" onclick="reviewRequest(\'' + r.id + '\',\'approved\'); tgCloseProfile(); setTimeout(openPendingRequestsModal, 500);">✔ موافقة</button>' +
                 '    <button class="bt bt-d" onclick="reviewRequest(\'' + r.id + '\',\'rejected\'); tgCloseProfile(); setTimeout(openPendingRequestsModal, 500);">✕ رفض</button>' +
                 '  </div>' +
                 '</div>';
        });
        h += '</div>';
        var bodyEl = document.getElementById('pendingReqsBody');
        if(bodyEl) bodyEl.innerHTML = h;
    });
}

function reviewRequest(reqId,newStatus){
    db.collection('requests').doc(reqId).get().then(function(snap){
        var req = snap.exists ? snap.data() : {};
        return db.collection('requests').doc(reqId).update({
            status:newStatus,
            reviewedBy:(TG_USER?TG_USER.name:''),
            reviewedAt:new Date()
        }).then(function(){
            // إشعار الموظف بنتيجة طلبه فور المراجعة
            if(req.uid && typeof tgSendPushToUser === 'function'){
                var okStatus = newStatus === 'approved';
                var title = okStatus ? '✅ تمت الموافقة على طلبك' : '❌ تم رفض طلبك';
                var body = (req.type || 'طلب') + (req.fromDate ? (' — من ' + req.fromDate + (req.toDate ? (' إلى ' + req.toDate) : '')) : '');
                tgSendPushToUser(req.uid, title, body, 'request-reviewed');
            }
        });
    }).then(loadStaffOverview).catch(function(err){ alert('تعذر تحديث الطلب: '+err.message); });
}

// ─── تعديل اسم الموظف من "متابعة الموظفين" ─────────────────────────────
function toggleEmpNameEdit(idx){
    var e=document.getElementById('empNameEdit'+idx);
    if(!e)return;
    e.style.display=(e.style.display==='none'||!e.style.display)?'flex':'none';
}
function saveEmpName(uid,idx){
    var name=(document.getElementById('empNameInput'+idx).value||'').trim();
    var msg=document.getElementById('empNameMsg'+idx);
    if(!name){ msg.style.color='var(--no)'; msg.textContent='اكتب اسماً صحيحاً.'; return; }
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(uid).get().then(function(doc){
        var jt = doc.data().jobTitle || '';
        var finalName = jt ? name + ' (' + jt + ')' : name;
        return db.collection('users').doc(uid).update({baseName: name, name: finalName});
    }).then(function(){
        addEmployeeName(name);
        loadStaffOverview();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}

// ─── تعديل المسمى الوظيفي من "متابعة الموظفين" ─────────────────────────
function toggleEmpJobEdit(idx){
    var e=document.getElementById('empJobEdit'+idx);
    if(!e)return;
    e.style.display=(e.style.display==='none'||!e.style.display)?'flex':'none';
}
function saveEmpJob(uid,idx){
    var jobTitle=(document.getElementById('empJobInput'+idx).value||'').trim();
    var msg=document.getElementById('empJobMsg'+idx);
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(uid).get().then(function(doc){
        var baseName = doc.data().baseName || doc.data().name || '';
        if (baseName.includes(' (')) baseName = baseName.split(' (')[0].trim();
        var finalName = jobTitle ? baseName + ' (' + jobTitle + ')' : baseName;
        return db.collection('users').doc(uid).update({jobTitle: jobTitle, baseName: baseName, name: finalName});
    }).then(function(){
        loadStaffOverview();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}

// ─── تعديل القسم ورقم الهاتف من "متابعة الموظفين" ─────────────────────────
function toggleEmpDeptPhoneEdit(idx){
    var e=document.getElementById('empDeptPhoneEdit'+idx);
    if(!e)return;
    e.style.display=(e.style.display==='none'||!e.style.display)?'flex':'none';
}
function saveEmpDeptPhone(uid,idx){
    var dept=(document.getElementById('empDeptInput'+idx).value||'').trim();
    var phone=(document.getElementById('empPhoneInput'+idx).value||'').trim();
    var msg=document.getElementById('empDeptPhoneMsg'+idx);
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(uid).update({dept: dept, phone: phone}).then(function(){
        loadStaffOverview();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}

// ─── تعديل نظام العمل من "متابعة الموظفين" ─────────────────────────
function toggleEmpWorkMode(idx){
    var e=document.getElementById('empWorkModeEdit'+idx);
    if(!e)return;
    e.style.display=(e.style.display==='none'||!e.style.display)?'flex':'none';
}
function saveEmpWorkMode(uid,idx){
    var workMode=(document.getElementById('empWorkModeInput'+idx).value||'office');
    var msg=document.getElementById('empWorkModeMsg'+idx);
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(uid).update({workMode:workMode}).then(function(){
        loadStaffOverview();
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}

// ─── تعطيل / إعادة تفعيل حساب موظف (يمنع الدخول بدون فقد أي بيانات) ────
function toggleEmpDisabled(uid,currentlyDisabled){
    db.collection('users').doc(uid).update({disabled:!currentlyDisabled}).then(loadStaffOverview)
      .catch(function(err){ alert('تعذر تحديث حالة الحساب: '+err.message); });
}

function tgToggleEmpChatAccess(uid, currentAccess) {
    if(!confirm(currentAccess ? 'هل أنت متأكد من منع هذا الموظف من استخدام الشات العام؟' : 'هل أنت متأكد من السماح لهذا الموظف باستخدام الشات العام؟')) return;
    db.collection('users').doc(uid).update({ chatAccess: !currentAccess }).then(function(){
        tgToast('✅ تم تحديث صلاحية الشات بنجاح','ok');
        loadStaffOverview();
    }).catch(function(err){
        tgToast('❌ تعذر تحديث الصلاحية: '+err.message,'err');
    });
}

// ─── حذف موظف: يسأل في كل مرة بين تعطيل فقط أو حذف نهائي كامل ─────────
function openDeleteEmpModal(uid,idx){
    var emp=(window._staffEmpCache||[])[idx];
    var name=escH(emp?(emp.name||emp.email):'');
    tgConfirmModal(
        '🗑 حذف / تعطيل: '+name,
        'اختر الإجراء المناسب لحساب هذا الموظف:<br><br>'+
        '<b>تعطيل الحساب:</b> يمنعه من الدخول فوراً، مع الاحتفاظ الكامل بسجل مشاريعه وإنجازاته وطلباته السابقة (يمكن التراجع لاحقاً).<br><br>'+
        '<b>حذف نهائي:</b> يمسح ملفه من النظام، ويزيله من كل المشاريع المُسندة إليه، ويحذف إنجازاته وطلباته وتقاريره الأسبوعية نهائياً — إجراء لا يمكن التراجع عنه. '+
        '(ملاحظة: حساب الدخول في Firebase Authentication نفسه يبقى موجوداً تقنياً ولازم يتحذف يدوياً من Firebase Console لو حبيت إزالته بالكامل، لكنه لن يقدر يدخل على النظام بعد الحذف).',
        [
            {label:'إلغاء', cls:'bt-o', onClick:tgCloseModal},
            {label:'🚫 تعطيل الحساب فقط', cls:'bt-p', onClick:function(){ tgCloseModal(); toggleEmpDisabled(uid,false); }},
            {label:'🗑 حذف نهائي مع كل بياناته', cls:'bt-d', onClick:function(){ tgCloseModal(); permanentlyDeleteEmployee(uid,name); }}
        ]
    );
}
function permanentlyDeleteEmployee(uid,name){
    tgConfirmModal(
        '⚠️ تأكيد نهائي',
        'هل أنت متأكد تماماً من حذف "'+name+'" وكل بياناته نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
        [
            {label:'إلغاء', cls:'bt-o', onClick:tgCloseModal},
            {label:'🗑 نعم، احذف نهائياً', cls:'bt-d', onClick:function(){
                tgCloseModal();
                Promise.all([
                    db.collection('projects').where('assignees','array-contains',uid).get(),
                    db.collection('achievements').where('uid','==',uid).get(),
                    db.collection('requests').where('uid','==',uid).get(),
                    db.collection('weeklyReports').where('uid','==',uid).get(),
                    db.collection('projectComments').where('uid','==',uid).get(),
                    db.collection('attendance_logs').where('uid','==',uid).get(),
                    db.collection('employeeDocuments').where('uid','==',uid).get(),
                    db.collection('chatMessages').where('senderId','==',uid).get(),
                    db.collection('formRequests').where('sentByUid','==',uid).get(),
                    db.collection('formRequests').where('targetUid','==',uid).get()
                ]).then(function(res){
                    var batch=db.batch();
                    var delRefs = {};
                    res[0].forEach(function(d){
                        var data=d.data();
                        var assignees=(data.assignees||[]).filter(function(a){return a!==uid;});
                        var pm=Object.assign({},data.progressMap||{});
                        delete pm[uid];
                        batch.update(d.ref,{assignees:assignees,progressMap:pm});
                    });
                    for(var i=1; i<=9; i++) {
                        res[i].forEach(function(d){ delRefs[d.ref.path] = d.ref; });
                    }
                    Object.values(delRefs).forEach(function(ref) { batch.delete(ref); });
                    batch.delete(db.collection('users').doc(uid));
                    return batch.commit();
                }).then(loadStaffOverview).catch(function(err){
                    alert('تعذر إتمام الحذف بالكامل: '+err.message);
                });
            }}
        ]
    );
}
function createStaffAccount(){
    var name=(document.getElementById('newAccName').value||'').trim();
    var email=(document.getElementById('newAccEmail').value||'').trim();
    var pass=document.getElementById('newAccPass').value||'';
    var jobTitle=(document.getElementById('newAccJobTitle').value||'').trim();
    var dept=(document.getElementById('newAccDept') ? document.getElementById('newAccDept').value||'' : '').trim();
    var phone=(document.getElementById('newAccPhone') ? document.getElementById('newAccPhone').value||'' : '').trim();
    var roleEl=document.getElementById('newAccRole');
    var role=roleEl?roleEl.value:'employee';
    var wmEl=document.getElementById('newAccWorkMode');
    var workMode=wmEl?wmEl.value:'office';
    var msg=document.getElementById('newAccMsg');
    if(!name||!email||!pass){ msg.style.color='var(--no)'; msg.textContent='من فضلك املأ الاسم والبريد الإلكتروني وكلمة المرور.'; return; }
    if(pass.length<6){ msg.style.color='var(--no)'; msg.textContent='كلمة المرور يجب أن تكون 6 أحرف على الأقل.'; return; }
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ إنشاء الحساب...';
    tgCreateEmployeeAccount(name,email,pass,'',jobTitle,role,workMode,dept,phone,function(){
        if(role==='employee') addEmployeeName(name);
        var roleAr = role==='tech_admin' ? 'أدمن تقني' : 'موظف';
        msg.style.color='var(--ok)'; msg.textContent='✅ تم إنشاء حساب '+roleAr+' بنجاح.';
        document.getElementById('newAccName').value='';
        document.getElementById('newAccEmail').value='';
        document.getElementById('newAccPass').value='';
        document.getElementById('newAccJobTitle').value='';
        if(document.getElementById('newAccDept')) document.getElementById('newAccDept').value='';
        if(document.getElementById('newAccPhone')) document.getElementById('newAccPhone').value='';
        if(roleEl) roleEl.value='employee';
        loadStaffOverview();
    },function(err){
        var map={'auth/email-already-in-use':'هذا البريد الإلكتروني مستخدم بالفعل.','auth/invalid-email':'صيغة البريد الإلكتروني غير صحيحة.','auth/weak-password':'كلمة المرور ضعيفة جداً.'};
        msg.style.color='var(--no)'; msg.textContent='❌ '+(map[err.code]||err.message);
    });
}

// ─── إدارة المشاريع (إنشاء المشاريع وتعيين الموظفين مباشرة من الموقع) ─────
function loadPmgmtData(){
    var assigneesBox=document.getElementById('pmgmtAssignees');
    var listBox=document.getElementById('pmgmtList');
    if(!assigneesBox||!listBox)return;
    db.collection('users').where('role','==','employee').get().then(function(snap){
        PMGMT_EMPLOYEES=[];
        snap.forEach(function(doc){PMGMT_EMPLOYEES.push(Object.assign({uid:doc.id},doc.data()));});
        PMGMT_EMPLOYEES.sort(function(a,b){return (a.name||a.email||'').localeCompare((b.name||b.email||''),'ar');});
        renderPmgmtAssigneesBox();
        return db.collection('projects').get();
    }).then(function(snap){
        var list=[];
        snap.forEach(function(doc){list.push(Object.assign({id:doc.id},doc.data()));});
        var proms=list.map(function(p){
            return db.collection('projectComments').where('projectId','==',p.id).get().then(function(csnap){
                p.comments=csnap.docs.map(function(d){return Object.assign({id:d.id},d.data());})
                    .sort(function(a,b){
                        var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
                        var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
                        return am-bm;
                    });
                return p;
            });
        });
        return Promise.all(proms);
    }).then(renderProjectsList).catch(function(err){
        listBox.innerHTML='<div class="empty-hint" style="color:var(--no)">تعذر تحميل البيانات: '+escH(err.message)+'</div>';
    });
}
function renderPmgmtAssigneesBox(){
    var box=document.getElementById('pmgmtAssignees');
    if(!box)return;
    if(!PMGMT_EMPLOYEES.length){
        box.innerHTML='<div class="empty-hint">لا يوجد موظفون مسجّلون بعد. أنشئ حسابات الموظفين أولاً من "متابعة الموظفين".</div>';
        return;
    }
    box.innerHTML=PMGMT_EMPLOYEES.map(function(e){
        return '<label><input type="checkbox" class="pm-assignee-chk" value="'+e.uid+'"> '+escH(e.name||e.email)+'</label>';
    }).join('');
}
function createProject(){
    var title=(document.getElementById('pmTitle').value||'').trim();
    var desc=(document.getElementById('pmDesc').value||'').trim();
    var priority=document.getElementById('pmPriority').value;
    var status=document.getElementById('pmStatus').value;
    var deadline=document.getElementById('pmDeadline').value||'';
    var linkUrl=(document.getElementById('pmLink').value||'').trim();
    var msg=document.getElementById('pmCreateMsg');
    var fileInput=document.getElementById('pmFile');
    var file=fileInput && fileInput.files && fileInput.files[0];
    var checked=Array.prototype.slice.call(document.querySelectorAll('#pmgmtAssignees .pm-assignee-chk:checked')).map(function(c){return c.value;});
    if(!title){ msg.style.color='var(--no)'; msg.textContent='من فضلك اكتب عنوان المشروع.'; return; }
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ إنشاء المشروع...';

    var createdByRole = (TG_USER && TG_USER.role === 'tech_admin') ? 'أدمن تقني' : 'أدمن إداري';
    var projectData = {
        title:title, description:desc, assignees:checked, progressMap:{},
        priority:priority, status:status, deadline:deadline,
        createdAt:new Date(),
        createdBy:(TG_USER?(TG_USER.name||TG_USER.email||'الأدمن'):''), createdByUid:(TG_USER?TG_USER.uid:''),
        createdByRole: createdByRole
    };
    if(linkUrl) projectData.linkUrl = linkUrl;

    var onDone = function(){
        msg.style.color='var(--ok)'; msg.textContent='✅ تم إنشاء المشروع بنجاح.';
        document.getElementById('pmTitle').value='';
        document.getElementById('pmDesc').value='';
        document.getElementById('pmDeadline').value='';
        document.getElementById('pmPriority').value='متوسطة';
        document.getElementById('pmStatus').value='مخطط له';
        if(document.getElementById('pmLink')) document.getElementById('pmLink').value='';
        if(fileInput) fileInput.value='';
        var fnSpan = document.getElementById('pmFileName');
        if(fnSpan) fnSpan.textContent='';
        document.querySelectorAll('#pmgmtAssignees .pm-assignee-chk').forEach(function(c){c.checked=false;});
        loadPmgmtData();
        // إرسال Push Notification لكل موظف مسؤول عن المشروع
        if(typeof tgSendPushToUser === 'function'){
            checked.forEach(function(empUid){
                tgSendPushToUser(empUid, '📁 مشروع جديد', 'تمت إضافتك لمشروع: ' + title, 'project-new');
            });
        }
    };

    if(file){
        var MAX_MB = 20;
        if(file.size > MAX_MB * 1024 * 1024){ msg.style.color='var(--no)'; msg.textContent='الملف كبير جداً (الحد الأقصى '+MAX_MB+' MB).'; return; }
        var prog = document.getElementById('pmUploadProg');
        if(prog) { prog.style.display = 'block'; prog.textContent = '⏳ جاري رفع المرفق... 0%'; }
        var uniqueName = Date.now() + '_' + file.name;
        tgUploadFile('projects', uniqueName, file,
            function(pct){
                if(prog) prog.textContent = '⏳ جاري رفع المرفق... ' + pct + '%';
            },
            function(errMsg){
                if(prog) prog.style.display='none';
                msg.style.color='var(--no)'; msg.textContent='❌ تعذر رفع الملف: '+errMsg;
            },
            function(publicUrl){
                projectData.fileUrl = publicUrl;
                projectData.fileName = file.name;
                projectData.fileType = file.type;
                db.collection('projects').add(projectData).then(function(){
                    if(prog) { prog.style.display='none'; prog.textContent=''; }
                    onDone();
                }).catch(function(err){
                    if(prog) prog.style.display='none';
                    msg.style.color='var(--no)'; msg.textContent='❌ '+err.message;
                });
            }
        );
        return;
    }

    try {
        db.collection('projects').add(projectData).then(onDone).catch(function(err){
            console.error("Project Create Error:", err);
            msg.style.color='var(--no)'; msg.textContent='❌ تعذر إنشاء المشروع: '+err.message;
            tgToast('❌ تعذر إنشاء المشروع: ' + err.message, 'err');
        });
    } catch(syncErr) {
        console.error("Sync Error in createProject:", syncErr);
        msg.style.color='var(--no)'; msg.textContent='❌ خطأ تقني: '+syncErr.message;
        tgToast('❌ خطأ تقني: ' + syncErr.message, 'err');
    }
}
function deleteTask(id) {
    tgConfirmModal('🗑️ حذف المهمة', 'هل أنت متأكد من حذف هذه المهمة نهائياً؟', [
        { label: 'إلغاء', cls: 'bt-o', onClick: tgCloseModal },
        { label: 'نعم، حذف', cls: 'bt-d', onClick: function() {
            db.collection('tasks').doc(id).delete().then(function() {
                tgCloseModal();
                tgToast('✅ تم حذف المهمة بنجاح', 'ok');
                loadTasksMgmt();
            }).catch(function(err) {
                alert('❌ خطأ أثناء الحذف: ' + err.message);
            });
        }}
    ]);
}

// ─── توزيع المهام (الأدمن يكلّف موظفاً بمهمة، والموظف يتابع حالتها من بوابته) ───
function loadTasksMgmt(){
    var assigneeSel=document.getElementById('tkAssignee');
    var listBox=document.getElementById('tasksMgmtList');
    if(!assigneeSel||!listBox)return;
    db.collection('users').where('role','==','employee').get().then(function(snap){
        var employees=[];
        snap.forEach(function(doc){employees.push(Object.assign({uid:doc.id},doc.data()));});
        employees.sort(function(a,b){return (a.name||a.email||'').localeCompare((b.name||b.email||''),'ar');});
        if(!employees.length){
            assigneeSel.innerHTML='<option value="">لا يوجد موظفون مسجّلون بعد</option>';
        }else{
            assigneeSel.innerHTML=employees.map(function(e){
                return '<option value="'+e.uid+'" data-name="'+escH(e.name||e.email)+'">'+escH(e.name||e.email)+(e.jobTitle?(' — '+escH(e.jobTitle)):'')+'</option>';
            }).join('');
        }
        return db.collection('tasks').get();
    }).then(function(snap){
        var list=[];
        snap.forEach(function(doc){list.push(Object.assign({id:doc.id},doc.data()));});
        list.sort(function(a,b){
            var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
            var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
            return bm-am;
        });
        renderTasksMgmtList(list);
    }).catch(function(err){
        listBox.innerHTML='<div class="empty-hint" style="color:var(--no)">تعذر تحميل المهام: '+escH(err.message)+'</div>';
    });
}
function renderTasksMgmtList(list){
    var box=document.getElementById('tasksMgmtList');
    if(!box)return;
    window._tasksMgmtCache=list;
    if(!list.length){ box.innerHTML='<div class="empty-hint">لا توجد مهام مُكلَّفة بعد.</div>'; return; }

    // حساب عدد المهام لكل حالة
    var counts = { all: list.length, '1': 0, '2': 0, '3': 0, late: 0 };
    var now = Date.now();
    list.forEach(function(t){
        var sVal = t.status === 'مكتمل' ? '3' : (t.status === 'جاري العمل' ? '2' : '1');
        if(counts[sVal] !== undefined) counts[sVal]++;
        if(isOverdue(t.deadline, t.status)) counts.late++;
    });
    
    // تحديث أرقام التبويبات
    ['all', '1', '2', '3', 'late'].forEach(function(key){
        var el = document.getElementById('tab-count-' + key);
        if(el) el.textContent = counts[key] || 0;
    });

    var empBtns = document.getElementById('tgEmpFilterBtns');
    if(empBtns) {
        var empSet2 = new Set();
        list.forEach(function(t){ if(t.assignedToName) empSet2.add(t.assignedToName); });
        var savedEmp = window._tgActiveEmpTaskFilter || '';
        var btnsH = '<button class="tg-emp-btn'+(savedEmp===''?' tg-emp-active':'')+'" onclick="tgSetTaskEmpFilter(this,\'\')">الكل</button>';
        Array.from(empSet2).sort(function(a,b){return a.localeCompare(b,'ar');}).forEach(function(e){
            btnsH += '<button class="tg-emp-btn'+(e===savedEmp?' tg-emp-active':'')+'" onclick="tgSetTaskEmpFilter(this,\''+e.replace(/'/g,'\\x27')+'\')">'+escH(e)+'</button>';
        });
        empBtns.innerHTML = btnsH;
    }

    // بناء كروت المهام
    var h = '<div class="tg-tasks-grid">';
    list.forEach(function(t){
        var sVal = t.status === 'مكتمل' ? '3' : (t.status === 'جاري العمل' ? '2' : '1');
        var lateTask = isOverdue(t.deadline, t.status);
        var prioClass = t.priority === 'عالية' ? 'prio-high' : (t.priority === 'متوسطة' ? 'prio-med' : 'prio-low');
        var statusClass = 'status-' + sVal;
        
        var createdAtStr = '';
        if(t.createdAt && typeof t.createdAt.toDate === 'function') {
            var cd = t.createdAt.toDate();
            createdAtStr = cd.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        
        h += '<div class="tg-task-card ' + (lateTask ? 'task-late' : '') + '" data-status="' + sVal + '" data-late="' + (lateTask ? '1' : '0') + '">';
        
        // رأس الكارت
        h += '<div class="task-card-header">';
        h += '<div class="task-card-title">' + escH(t.title || 'بدون عنوان') + '</div>';
        h += '<div class="task-card-badges">';
        h += '<span class="task-badge ' + prioClass + '">' + escH(t.priority || 'متوسطة') + '</span>';
        h += '<span class="task-badge ' + statusClass + '">' + escH(t.status || 'لم يبدأ') + '</span>';
        if(lateTask) h += '<span class="task-badge badge-late">متأخرة ⚠️</span>';
        h += '</div></div>';
        
        // معلومات المهمة
        h += '<div class="task-card-body">';
        h += '<div class="task-card-info"><span class="info-icon">👤</span><span class="info-text">' + escH(t.assignedToName || 'مجهول') + '</span></div>';
        if(t.deadline) h += '<div class="task-card-info"><span class="info-icon">📅</span><span class="info-text">' + escH(t.deadline) + '</span></div>';
        if(createdAtStr) h += '<div class="task-card-info"><span class="info-icon">🕒</span><span class="info-text">' + createdAtStr + '</span></div>';
        if(t.description) h += '<div class="task-card-desc">' + tgMakeExpandable(t.description, 120) + '</div>';
        
        // المرفقات
        if(t.fileUrl && t.fileType){
            if(t.fileType.indexOf('image/') === 0){
                h += '<div class="task-card-attach"><a href="' + t.fileUrl + '" target="_blank"><img src="' + t.fileUrl + '" alt="مرفق"></a></div>';
            } else if(t.fileType.indexOf('video/') === 0){
                h += '<div class="task-card-attach"><video src="' + t.fileUrl + '" controls></video></div>';
            } else {
                h += '<div class="task-card-attach-file"><a href="' + t.fileUrl + '" target="_blank">📎 ' + escH(t.fileName || 'ملف مرفق') + '</a></div>';
            }
        }
        
        // سجل التحويل
        if(t.history && t.history.length > 0) {
            h += '<div class="task-card-history"><div class="history-title">📜 سجل تحويل المهمة</div>';
            t.history.forEach(function(hi){
                if(hi.action === 'forwarded') {
                    var dStr = hi.date ? new Date(hi.date).toLocaleString('ar-EG', { hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                    h += '<div class="history-item">';
                    h += '<div><strong>من:</strong> ' + escH(hi.fromName) + ' <strong>إلى:</strong> ' + escH(hi.toName) + ' <span class="history-date">(' + dStr + ')</span></div>';
                    if(hi.note) h += '<div class="history-note">💬 ' + tgMakeExpandable(hi.note, 100) + '</div>';
                    h += '</div>';
                }
            });
            h += '</div>';
        }
        
        h += '</div>'; // close body
        
        // تذييل الكارت
        h += '<div class="task-card-footer" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
        h += '<div class="fg" style="margin:0;max-width:160px"><select id="tks_' + t.id + '" style="height:32px;font-size:11px;padding:2px 6px" onchange="saveTaskStatus(\'' + t.id + '\')">' +
            ['لم يبدأ','جاري العمل','متوقف','مكتمل'].map(function(s){return '<option' + (s === (t.status || 'لم يبدأ') ? ' selected' : '') + '>' + s + '</option>';}).join('') +
            '</select></div>';
        h += '<button class="bt bt-p bt-sm" style="font-size:11px;padding:4px 10px" onclick="saveTaskStatus(\'' + t.id + '\')">💾 حفظ الحالة</button>';
        h += ' <span id="tkmsg_' + t.id + '" style="font-size:10.5px"></span>';
        h += '<button class="bt bt-d bt-sm" style="margin-right:auto" onclick="deleteTask(\'' + t.id + '\')">🗑 حذف</button>';
        h += '</div>';
        
        h += '</div>'; // close card
    });
    h += '</div>'; // close grid
    
    box.innerHTML = h;
    
    // تطبيق الفلتر النشط
    tgApplyActiveTaskFilter();
}

// تبديل التبويب النشط
window._tgActiveTaskTab = '';
function tgSetTaskStatusTab(btn, status){
    window._tgActiveTaskTab = status;
    
    // تحديث التبويب النشط
    document.querySelectorAll('.tg-task-tab').forEach(function(tab){
        tab.classList.remove('tg-task-tab-active');
    });
    btn.classList.add('tg-task-tab-active');
    
    // تطبيق الفلتر
    tgApplyActiveTaskFilter();
}


window.saveTaskStatus = function(taskId) {
    if (!taskId) return;
    var sel = document.getElementById('tks_' + taskId);
    var msgEl = document.getElementById('tkmsg_' + taskId);
    if (!sel) return;

    var newStatus = sel.value;
    if (msgEl) {
        msgEl.style.color = '#0284c7';
        msgEl.innerHTML = '⏳ جاري حفظ الحالة...';
    }

    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) {
        if (msgEl) { msgEl.style.color = '#ef4444'; msgEl.innerHTML = '❌ تعذر الاتصال بقاعدة البيانات'; }
        return;
    }

    var updateData = {
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        statusUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (newStatus === 'مكتمل') {
        updateData.done = true;
        updateData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
    } else {
        updateData.done = false;
    }

    targetDb.collection('tasks').doc(taskId).update(updateData).then(function() {
        if (msgEl) {
            msgEl.style.color = '#10b981';
            msgEl.innerHTML = '✅ تم حفظ الحالة بنجاح!';
            setTimeout(function() { if (msgEl) msgEl.innerHTML = ''; }, 3500);
        }
        if (typeof tgShowToast === 'function') tgShowToast('✅ تم حفظ حالة المهمة بنجاح: ' + newStatus);
        if (typeof tgToast === 'function') tgToast('✅ تم حفظ حالة المهمة بنجاح: ' + newStatus, 'ok');
        if (newStatus === 'مكتمل' && typeof tgCelebrate === 'function') tgCelebrate();

        // Update card attribute & summary
        var selEl = document.getElementById('tks_' + taskId);
        if (selEl) {
            var card = selEl.closest('.pj-row') || selEl.closest('.task-card') || selEl.closest('.tg-task-card');
            if (card) {
                var sVal = newStatus === 'مكتمل' ? '3' : (newStatus === 'جاري العمل' ? '2' : '1');
                card.setAttribute('data-status', sVal);
                card.setAttribute('data-taskstatus', newStatus);
            }
        }

        if (typeof tgApplyActiveTaskFilter === 'function') tgApplyActiveTaskFilter();
        if (typeof updateTasksEmployeeSummary === 'function') updateTasksEmployeeSummary();
        if (typeof loadTasksMgmt === 'function') setTimeout(loadTasksMgmt, 1000);

        // إرسال إشعار للموظف المكلَّف وتوثيق الإنجاز تلقائياً
        targetDb.collection('tasks').doc(taskId).get().then(function(docSnap) {
            if (docSnap.exists) {
                var taskData = docSnap.data();
                var taskTitle = taskData.title || 'مهمة';
                var assignedToUid = taskData.assignedTo;
                
                if (typeof tgSendPushToUser === 'function' && assignedToUid) {
                    tgSendPushToUser(assignedToUid, '📋 تحديث حالة مهمة', 'قام الأدمن بتغيير حالة المهمة «' + taskTitle + '» إلى: ' + newStatus, 'task-status');
                }

                // تسجيل المهمة المكتملة في لوحة الإنجازات تلقائياً
                if (newStatus === 'مكتمل') {
                    var empUid = assignedToUid || (window.TG_USER ? window.TG_USER.uid : '');
                    var assignedName = taskData.assignedToName || 'موظف';
                    var todayStr = new Date().toISOString().split('T')[0];
                    
                    targetDb.collection('achievements').where('taskId', '==', taskId).get().then(function(achSnap) {
                        if (achSnap.empty) {
                            targetDb.collection('achievements').add({
                                taskId: taskId,
                                uid: empUid,
                                userName: assignedName,
                                title: taskTitle,
                                description: taskData.description || 'تم إنجاز المهمة بنجاح والتأكيد عليها من الإدارة.',
                                date: todayStr,
                                reactions: {},
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            }).then(function() {
                                if (typeof loadMyAchievements === 'function') loadMyAchievements();
                            }).catch(function(err){ console.error("Error creating achievement:", err); });
                        }
                    }).catch(function(){});
                }
            }
        }).catch(function(){});

    }).catch(function(err) {
        console.error("Error saving task status:", err);
        if (msgEl) {
            msgEl.style.color = '#ef4444';
            msgEl.innerHTML = '❌ فشل الحفظ: ' + (err.message || err);
        }
    });
};

window.forwardTask = function(taskId) {
    if (!taskId) return;
    var empSel = document.getElementById('tkfwd_' + taskId);
    var noteTxt = document.getElementById('tkfwd_note_' + taskId);
    var msgEl = document.getElementById('tkfwd_msg_' + taskId);

    if (!empSel || !empSel.value) {
        alert("⚠️ يرجى اختيار الزميل المراد إرسال المهمة إليه أولاً.");
        return;
    }

    var targetEmpId = empSel.value;
    var teammates = (typeof _teammatesCache !== 'undefined' ? _teammatesCache : []) || [];
    var targetEmpObj = teammates.find(function(e) { return e.id === targetEmpId || e.uid === targetEmpId; });
    var targetEmpName = targetEmpObj ? (targetEmpObj.name || targetEmpObj.displayName) : 'زميل';
    var note = noteTxt ? noteTxt.value.trim() : '';

    if (msgEl) {
        msgEl.style.color = '#0284c7';
        msgEl.innerHTML = '⏳ جاري إرسال المهمة للزميل...';
    }

    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) {
        if (msgEl) { msgEl.style.color = '#ef4444'; msgEl.innerHTML = '❌ تعذر الاتصال بقاعدة البيانات'; }
        return;
    }

    var currentUser = window.TG_USER || {};
    var myName = currentUser.name || currentUser.displayName || 'موظف';

    var historyEntry = {
        action: 'forwarded',
        fromUid: currentUser.uid || '',
        fromName: myName,
        toUid: targetEmpId,
        toName: targetEmpName,
        note: note,
        date: new Date().toISOString()
    };

    targetDb.collection('tasks').doc(taskId).update({
        assignedTo: targetEmpId,
        assignedToName: targetEmpName,
        history: firebase.firestore.FieldValue.arrayUnion(historyEntry),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        if (msgEl) {
            msgEl.style.color = '#10b981';
            msgEl.innerHTML = '✅ تم إرسال المهمة إلى ' + targetEmpName + ' بنجاح!';
        }
        if (typeof tgShowToast === 'function') tgShowToast('📩 تم إرسال المهمة للزميل بنجاح!');
        if (typeof loadMyTasks === 'function') setTimeout(loadMyTasks, 1200);
    }).catch(function(err) {
        console.error("Error forwarding task:", err);
        if (msgEl) {
            msgEl.style.color = '#ef4444';
            msgEl.innerHTML = '❌ فشل الإرسال: ' + err.message;
        }
    });
};


window._tgActiveEmpTaskFilter = '';
function tgSetTaskEmpFilter(btn, emp){
    window._tgActiveEmpTaskFilter = emp;
    var p = btn.parentNode;
    if(p) {
        p.querySelectorAll('.tg-emp-btn').forEach(function(b){ b.classList.remove('tg-emp-active'); });
        btn.classList.add('tg-emp-active');
    }
    tgApplyActiveTaskFilter();
}

// تطبيق الفلتر بناءً على التبويب النشط
function tgApplyActiveTaskFilter(){
    var status = window._tgActiveTaskTab || '';
    var empFilter = window._tgActiveEmpTaskFilter || '';
    var searchInput = document.getElementById('tgTasksSearch');
    var search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var sortInput = document.getElementById('tgTasksSortBy');
    var sortBy = sortInput ? sortInput.value : '';

    var box = document.querySelector('.tg-tasks-grid');
    if(!box) return;
    var cardsArray = Array.from(box.querySelectorAll('.tg-task-card'));
    
    cardsArray.forEach(function(card){
        var show = true;
        var cardStatus = card.getAttribute('data-status');
        var isLate = card.getAttribute('data-late') === '1';
        
        if(status === 'late'){
            if(!isLate) show = false;
        } else if(status !== ''){
            if(cardStatus !== status) show = false;
        }

        if(empFilter !== ''){
            if(card.textContent.indexOf(empFilter) === -1) show = false;
        }

        if(search !== ''){
            if(card.textContent.toLowerCase().indexOf(search) === -1) show = false;
        }
        
        card.style.display = show ? '' : 'none';
    });

    if(sortBy !== ''){
        cardsArray.sort(function(a, b){
            if(sortBy === 'prio'){
                var pA = a.querySelector('.task-badge.prio-high') ? 3 : (a.querySelector('.task-badge.prio-med') ? 2 : 1);
                var pB = b.querySelector('.task-badge.prio-high') ? 3 : (b.querySelector('.task-badge.prio-med') ? 2 : 1);
                return pB - pA;
            }
            if(sortBy === 'emp'){
                var nA = a.querySelector('.task-card-info .info-text') ? a.querySelector('.task-card-info .info-text').textContent : '';
                var nB = b.querySelector('.task-card-info .info-text') ? b.querySelector('.task-card-info .info-text').textContent : '';
                return nA.localeCompare(nB, 'ar');
            }
            return 0;
        });
        cardsArray.forEach(function(card){ box.appendChild(card); });
    }
}



function createTask(){
    var sel=document.getElementById('tkAssignee');
    var uid=sel.value;
    var name=sel.selectedOptions&&sel.selectedOptions[0]?sel.selectedOptions[0].getAttribute('data-name'):'';
    var title=(document.getElementById('tkTitle').value||'').trim();
    var desc=(document.getElementById('tkDesc').value||'').trim();
    var priority=document.getElementById('tkPriority').value;
    var deadline=document.getElementById('tkDeadline').value||'';
    var fileInput=document.getElementById('tkFile');
    var file=fileInput && fileInput.files && fileInput.files[0];
    var msg=document.getElementById('tkCreateMsg');
    if(!uid){ msg.style.color='var(--no)'; msg.textContent='من فضلك اختر الموظف المكلَّف.'; return; }
    if(!title){ msg.style.color='var(--no)'; msg.textContent='من فضلك اكتب عنوان المهمة.'; return; }
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ التكليف...';

    var createdByRole = (TG_USER && TG_USER.role === 'tech_admin') ? 'أدمن تقني' : 'أدمن إداري';
    var taskData = {
        title:title, description:desc, assignedTo:uid, assignedToName:name||'',
        priority:priority, deadline:deadline, status:'لم يبدأ',
        createdAt: new Date(),
        createdBy:(TG_USER?(TG_USER.name||TG_USER.email||'الأدمن'):''), createdByUid:(TG_USER?TG_USER.uid:''),
        createdByRole: createdByRole
    };

    var onDone = function(){
        msg.style.color='var(--ok)'; msg.textContent='✅ تم تكليف المهمة بنجاح.';
        document.getElementById('tkTitle').value='';
        document.getElementById('tkDesc').value='';
        document.getElementById('tkDeadline').value='';
        document.getElementById('tkPriority').value='متوسطة';
        if(fileInput) fileInput.value='';
        var fnSpan = document.getElementById('tkFileName');
        if(fnSpan) fnSpan.textContent='';
        loadTasksMgmt();
        // إرسال Push Notification للموظف المكلَّف
        if(typeof tgSendPushToUser === 'function' && uid){
            tgSendPushToUser(uid, '📋 مهمة جديدة', 'تم تكليفك بمهمة: ' + title, 'task-new');
        }
    };

    if(file){
        var MAX_MB = 20;
        if(file.size > MAX_MB * 1024 * 1024){ msg.style.color='var(--no)'; msg.textContent='الملف كبير جداً (الحد الأقصى '+MAX_MB+' MB).'; return; }
        var prog = document.getElementById('tkUploadProg');
        if(prog) { prog.style.display = 'block'; prog.textContent = '⏳ جاري رفع المرفق... 0%'; }
        var uniqueName = uid + '/' + Date.now() + '_' + file.name;
        tgUploadFile('tasks', uniqueName, file,
            function(pct){
                if(prog) prog.textContent = '⏳ جاري رفع المرفق... ' + pct + '%';
            },
            function(errMsg){
                if(prog) prog.style.display='none';
                msg.style.color='var(--no)'; msg.textContent='❌ تعذر رفع الملف: '+errMsg;
            },
            function(publicUrl){
                taskData.fileUrl = publicUrl;
                taskData.fileName = file.name;
                taskData.fileType = file.type;
                db.collection('tasks').add(taskData).then(function(){
                    if(prog) { prog.style.display='none'; prog.textContent=''; }
                    onDone();
                }).catch(function(err){
                    if(prog) prog.style.display='none';
                    msg.style.color='var(--no)'; msg.textContent='❌ '+err.message;
                });
            }
        );
        return;
    }

    try {
        db.collection('tasks').add(taskData).then(onDone).catch(function(err){
            console.error("Task Create Error:", err);
            msg.style.color='var(--no)'; msg.textContent='❌ تعذر تكليف المهمة: '+err.message;
            tgToast('❌ تعذر تكليف المهمة: ' + err.message, 'err');
        });
    } catch(syncErr) {
        console.error("Sync Error in createTask:", syncErr);
        msg.style.color='var(--no)'; msg.textContent='❌ خطأ تقني: '+syncErr.message;
        tgToast('❌ خطأ تقني: ' + syncErr.message, 'err');
    }
}
function empGo(id, el, force) {
    // Removed hasUnsavedText check to prevent annoying popups
}

// ─── شارات الأولوية / حالة المشروع / تاريخ الاستحقاق (مشتركة بين لوحة الأدمن وبوابة الموظف) ───
function prioBadgeClass(p){
    if(p==='عالية')return 'badge-prio-high';
    if(p==='منخفضة')return 'badge-prio-low';
    return 'badge-prio-med';
}
function pstatusBadgeClass(s){
    if(s==='جاري العمل')return 'badge-pstatus-progress';
    if(s==='متوقف')return 'badge-pstatus-hold';
    if(s==='مكتمل')return 'badge-pstatus-done';
    return 'badge-pstatus-plan';
}
function isOverdue(deadline,status){
    return !!deadline && status!=='مكتمل' && deadline < new Date().toISOString().split('T')[0];
}
function projectTagsHtml(p){
    var h='<div class="pj-tags">';
    h+='<span class="badge '+pstatusBadgeClass(p.status)+'">'+escH(p.status||'مخطط له')+'</span>';
    h+='<span class="badge '+prioBadgeClass(p.priority)+'">⚑ أولوية '+escH(p.priority||'متوسطة')+'</span>';
    if(p.deadline){
        var overdue=isOverdue(p.deadline,p.status);
        h+='<span class="badge '+(overdue?'badge-overdue':'badge-pstatus-plan')+'">📅 '+(overdue?'متأخر — استحقاقه ':'يستحق في ')+escH(p.deadline)+'</span>';
    }
    h+='</div>';
    return h;
}

// ─── نقاش/شات كل مشروع (مشترك بين لوحة الأدمن وبوابة الموظف) ─────────────
window._chatContainers = window._chatContainers || {};
// ═══════════════════════════════════════════════════════════════════════
// 💬 الشات العام اللحظي — ودجت عائم (فقاعة + لوحة) يظهر فوق كل الصفحات،
// بنفس فكرة شات فيسبوك ماسنجر — غرفة واحدة يشترك فيها الأدمن وكل الموظفين
// ═══════════════════════════════════════════════════════════════════════
var _chatUnsub = null;
var _chatMessages = [];
var _chatWidgetOpen = false;

// يُبنى مرة واحدة بس ويتضاف على body — بيفضل فوق كل الصفحات وأنت بتتنقل بينها
function tgChatMount(){
    if(TG_USER && TG_USER.role === 'employee' && TG_USER.chatAccess === false) return;
    if(document.getElementById('tgChatBubble')) return;
    
    if(!document.getElementById('emojiPickerScript')){
        var s = document.createElement('script');
        s.type = 'module';
        s.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@1.x.x/index.js';
        s.id = 'emojiPickerScript';
        document.head.appendChild(s);
    }
    if(!document.getElementById('twemojiScript')){
        var ts = document.createElement('script');
        ts.src = 'https://unpkg.com/@twemoji/api@14.1.0/dist/twemoji.min.js';
        ts.id = 'twemojiScript';
        document.head.appendChild(ts);
    }

    var wrap=document.createElement('div');
    wrap.id='tgChatWidgetWrap';
    wrap.innerHTML =
        '<div id="tgChatPanel" class="tg-chat-panel">'+
          '<div class="tg-chat-panel-h">'+
            '<span>💬 الشات العام</span>'+
            '<span class="tg-chat-panel-h-r">'+
              '<span class="tg-chat-panel-mute" id="tgChatMuteBtn" onclick="tgChatToggleMute()" title="كتم/تشغيل صوت الإشعارات">🔔</span>'+
              '<span class="tg-chat-panel-close" onclick="tgChatToggle(false)">✕</span>'+
            '</span>'+
          '</div>'+
          '<div class="pj-chat-log" id="tgChatLog"><div class="pj-chat-empty">جارِ تحميل الرسائل...</div></div>'+
          '<div id="tgChatReplyPreview" class="tg-chat-reply-preview" style="display:none">'+
             '<div class="tg-chat-reply-preview-text" id="tgChatReplyText"></div>'+
             '<div class="tg-chat-reply-preview-close" onclick="tgChatClearReply()">✕</div>'+
          '</div>'+
          '<div class="pj-chat-input-row" style="position:relative">'+
             '<div id="tgEmojiWrap" style="display:none;position:absolute;bottom:65px;right:10px;z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,0.15);border-radius:12px;overflow:hidden;">'+
                '<emoji-picker class="light"></emoji-picker>'+
             '</div>'+
             '<div id="tgChatMentions" class="tg-mention-list" style="display:none"></div>'+
            '<button class="bt bt-d" style="width:36px;height:36px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0" onclick="document.getElementById(\'tgChatInput\').value=\'\'; tgChatClearReply();" title="مسح المربع">🧹</button>'+
            '<button style="font-size:22px;background:transparent;border:none;cursor:pointer;padding:0 4px;opacity:0.7;transition:0.2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7" onclick="var p=document.getElementById(\'tgEmojiWrap\'); p.style.display=p.style.display===\'none\'?\'block\' : \'none\';" title="إضافة إيموجي">😀</button>'+
            '<textarea id="tgChatInput" rows="1" placeholder="اكتب رسالتك هنا... (اكتب @ للإشارة)" onkeydown="tgChatKeydown(event)" oninput="tgChatHandleInput(event)"></textarea>'+
            '<button class="btn-send" onclick="tgChatSend()">➤</button>'+
          '</div>'+
        '</div>'+
        '<div id="tgChatBubble" class="tg-chat-bubble" onclick="tgChatToggle()" title="الشات العام">'+
          '<span class="tg-chat-bubble-ic">💬</span>'+
          '<span class="tgChatBadge tg-chat-bubble-badge" id="tgChatBubbleBadge" style="display:none"></span>'+
        '</div>';
    document.body.appendChild(wrap);
    var mb=document.getElementById('tgChatMuteBtn');
    if(mb) mb.textContent = (localStorage.getItem('tg_chat_muted')==='1') ? '🔕' : '🔔';
    // فك قفل الصوت (سياسة المتصفحات بتطلب تفاعل أول) عند أول لمسة/كليك بالمستخدم
    var unlock=function(){ tgChatUnlockAudio(); document.removeEventListener('click',unlock); document.removeEventListener('keydown',unlock); };
    document.addEventListener('click',unlock);
    document.addEventListener('keydown',unlock);

    document.addEventListener('mousedown', function(e) {
        var panel = document.getElementById('tgChatPanel');
        var bubble = document.getElementById('tgChatBubble');
        var emoji = document.getElementById('tgEmojiWrap');
        if (_chatWidgetOpen && panel && bubble && !panel.contains(e.target) && !bubble.contains(e.target)) {
            if (emoji && emoji.contains(e.target)) return;
            tgChatToggle(false);
        }
    });

    setTimeout(function(){
        var picker = document.querySelector('emoji-picker');
        if(picker){
            picker.addEventListener('emoji-click', function(e){
                var inp = document.getElementById('tgChatInput');
                if(inp){
                    inp.value += e.detail.unicode;
                    document.getElementById('tgEmojiWrap').style.display = 'none';
                    inp.focus();
                }
            });
        }
    }, 1000);
}

function tgChatToggleMute(){
    var muted = localStorage.getItem('tg_chat_muted')==='1';
    muted = !muted;
    localStorage.setItem('tg_chat_muted', muted?'1':'0');
    var mb=document.getElementById('tgChatMuteBtn');
    if(mb) mb.textContent = muted ? '🔕' : '🔔';
    if(!muted) tgChatPlaySound(); // نغمة تجريبية عشان يسمع الفرق
}

function tgChatToggle(force){
    var panel=document.getElementById('tgChatPanel');
    var bubble=document.getElementById('tgChatBubble');
    if(!panel) return;
    
    var willClose = (typeof force === 'boolean') ? !force : _chatWidgetOpen;
    var inp = document.getElementById('tgChatInput');
    
    if (willClose && inp && inp.value.trim() !== '') {
        tgConfirmModal('إغلاق الشات؟', 'لديك نص غير مُرسل في الشات، هل أنت متأكد من إغلاقه؟', [
            {label: 'إلغاء', cls: 'bt-o', onClick: tgCloseModal},
            {label: 'إغلاق وتجاهل', cls: 'bt-d', onClick: function(){
                tgCloseModal();
                inp.value = '';
                _chatWidgetOpen = false;
                panel.classList.remove('open');
                if(bubble) bubble.classList.toggle('hide', window.innerWidth<=560);
            }}
        ]);
        return;
    }

    _chatWidgetOpen = (typeof force==='boolean') ? force : !_chatWidgetOpen;
    panel.classList.toggle('open', _chatWidgetOpen);
    if(bubble) bubble.classList.toggle('hide', _chatWidgetOpen && window.innerWidth<=560);
    if(_chatWidgetOpen){
        renderChatMessages();
        tgChatMarkRead();
        setTimeout(function(){ var inp=document.getElementById('tgChatInput'); if(inp) inp.focus(); },80);
    }
}

function tgChatKeydown(e){
    var list = document.getElementById('tgChatMentions');
    if(list && list.style.display !== 'none'){
        var items = list.querySelectorAll('.tg-mention-item');
        var active = list.querySelector('.tg-mention-item.active');
        var idx = Array.from(items).indexOf(active);

        if(e.key === 'ArrowDown'){
            e.preventDefault();
            if(active) active.classList.remove('active');
            var next = items[idx + 1] || items[0];
            if(next){ next.classList.add('active'); next.scrollIntoView({block:'nearest'}); }
            return;
        }
        if(e.key === 'ArrowUp'){
            e.preventDefault();
            if(active) active.classList.remove('active');
            var prev = items[idx - 1] || items[items.length - 1];
            if(prev){ prev.classList.add('active'); prev.scrollIntoView({block:'nearest'}); }
            return;
        }
        if(e.key === 'Enter' || e.key === 'Tab'){
            if(active){
                e.preventDefault();
                active.onclick();
                return;
            }
        }
        if(e.key === 'Escape'){
            e.preventDefault();
            list.style.display = 'none';
            return;
        }
    }
    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); tgChatSend(); }
}

function tgChatHandleInput(e){
    var inp = e.target;
    var val = inp.value;
    var pos = inp.selectionStart;
    var textBefore = val.substring(0, pos);
    var mentionMatch = textBefore.match(/@([\w\u0600-\u06FF_]*)$/);
    
    if(mentionMatch){
        tgChatShowMentions(mentionMatch[1]);
    } else {
        var list = document.getElementById('tgChatMentions');
        if(list) list.style.display = 'none';
    }
}

function tgChatShowMentions(filter){
    var list = document.getElementById('tgChatMentions');
    if(!list) return;
    var q = (filter || '').toLowerCase();
    var matches = EMPLOYEES.filter(function(name){
        return name.toLowerCase().indexOf(q) > -1;
    });

    if(!matches.length){
        list.style.display = 'none';
        return;
    }

    var h = '';
    matches.forEach(function(name, i){
        h += '<div class="tg-mention-item'+(i===0?' active':'')+'" onclick="tgChatInsertMention(\''+name.replace(/'/g,"\\'")+'\')">'+escH(name)+'</div>';
    });
    list.innerHTML = h;
    list.style.display = 'flex';
}

function tgChatInsertMention(name){
    var inp = document.getElementById('tgChatInput');
    if(!inp) return;
    var val = inp.value;
    var pos = inp.selectionStart;
    var textBefore = val.substring(0, pos);
    var textAfter = val.substring(pos);
    
    var newTextBefore = textBefore.replace(/@[\w\u0600-\u06FF_]*$/, '@' + name + ' ');
    inp.value = newTextBefore + textAfter;
    inp.focus();
    var newPos = newTextBefore.length;
    inp.setSelectionRange(newPos, newPos);
    
    document.getElementById('tgChatMentions').style.display = 'none';
}

// يبدأ الاستماع اللحظي لرسائل الشات (يُستدعى مرة واحدة بعد تسجيل الدخول)
var _chatInitialSnapDone = false;
function tgChatWatch(){
    if(_chatUnsub || !TG_USER) return;
    if(TG_USER.role === 'employee' && TG_USER.chatAccess === false) return;
    _chatUnsub = db.collection('chatMessages').orderBy('createdAt','asc').limitToLast(200)
        .onSnapshot(function(snap){
            _chatMessages=[];
            snap.forEach(function(d){ var m=d.data(); m.id=d.id; _chatMessages.push(m); });
            // صوت التنبيه: بس لو فيه رسالة جديدة "فعلاً" وصلت من شخص تاني (مش أول تحميل، ومش رسالتي أنا)
            if(_chatInitialSnapDone){
                var newFromOthers = snap.docChanges().some(function(ch){
                    if(ch.type!=='added') return false;
                    var d=ch.doc.data();
                    return !TG_USER || d.uid!==TG_USER.uid;
                });
                if(newFromOthers) tgChatPlaySound();
            }
            _chatInitialSnapDone = true;
            if(_chatWidgetOpen){
                renderChatMessages();
                tgChatMarkRead();
            } else {
                tgChatUpdateBadgeFromCache();
            }
        }, function(err){ console.error('tgChatWatch error:', err); });
}

// ─── صوت تنبيه الرسائل (Web Audio API — نغمة مُولَّدة، مفيش حاجة تتحمّل من النت) ───
var _tgAudioCtx=null, _tgAudioUnlocked=false;
function tgChatUnlockAudio(){
    if(_tgAudioUnlocked) return;
    try{
        _tgAudioCtx = _tgAudioCtx || new (window.AudioContext||window.webkitAudioContext)();
        if(_tgAudioCtx.state==='suspended') _tgAudioCtx.resume();
        _tgAudioUnlocked=true;
    }catch(e){}
}
function tgChatPlaySound(){
    if(localStorage.getItem('tg_chat_muted')==='1') return;
    try{
        _tgAudioCtx = _tgAudioCtx || new (window.AudioContext||window.webkitAudioContext)();
        if(_tgAudioCtx.state==='suspended') _tgAudioCtx.resume();
        var now=_tgAudioCtx.currentTime;
        _tgTone(_tgAudioCtx, 880.00, now, 0.13, 0.16);       // نغمة أولى (لا)
        _tgTone(_tgAudioCtx, 1318.51, now+0.10, 0.16, 0.19); // نغمة ثانية (مي) — أعلى شوية زي "دينج"
    }catch(e){}
}
function _tgTone(ctx, freq, start, dur, vol){
    var osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type='sine'; osc.frequency.value=freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(vol, start+0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start+dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(start); osc.stop(start+dur+0.03);
}

function renderChatMessages(){
    var log=document.getElementById('tgChatLog');
    if(!log) return;
    if(!_chatMessages.length){ log.innerHTML='<div class="pj-chat-empty">لا توجد رسائل بعد. ابدأ المحادثة! 👋</div>'; return; }
    
    var h='';
    var lastDate = '';
    
    _chatMessages.forEach(function(m){
        var t = (m.createdAt && m.createdAt.toDate) ? m.createdAt.toDate() : null;
        var dateStr = t ? t.toLocaleDateString('ar-EG') : '';
        
        // Date Separator logic
        if (dateStr !== lastDate) {
            var label = dateStr;
            var today = new Date().toLocaleDateString('ar-EG');
            var yest = new Date(Date.now() - 86400000).toLocaleDateString('ar-EG');
            if (dateStr === today) label = 'اليوم';
            else if (dateStr === yest) label = 'أمس';
            h += '<div class="pj-chat-date-sep">' + label + '</div>';
            lastDate = dateStr;
        }

        var mine = TG_USER && m.uid===TG_USER.uid;
        var timeStr = t ? t.toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'}) : '...';
        var roleLabel = m.role==='admin' ? 'أدمن' : 'موظف';
        var canDelete = TG_USER && (mine || TG_USER.role==='admin');
        
        h+='<div class="pj-chat-msg'+(mine?' mine':'')+'">'+
           '<div class="pj-chat-actions">'+
             '<span class="pj-chat-reply-btn" title="رد" onclick="tgChatSetReply(\''+m.id+'\', \''+escH(m.name||'')+'\', \''+escH((m.text||'').replace(/\\/g,'\\\\').replace(/\'/g,"\\'").replace(/\"/g,'&quot;').replace(/\n/g,'\\n'))+'\')">↩️</span>'+
             (canDelete?('<span class="pj-chat-del" title="حذف الرسالة" onclick="tgChatDelete(\''+m.id+'\')">🗑</span>'):'')+
           '</div>'+
           '<div class="pj-chat-bubble">'+
             '<div class="pj-chat-name">'+escH(m.name||'')+' <span class="pj-chat-role">'+roleLabel+'</span></div>'+
             (m.replyToId ? ('<div class="pj-chat-quote" dir="auto"><strong>'+escH(m.replyToName||'')+':</strong> '+escH(m.replyToText||'')+'</div>') : '') +
             '<div class="pj-chat-text" dir="auto">'+
                escH(m.text||'')
                .replace(/(@[^\n@]+?)(?=\s|$|@)/g, '<span style="color:var(--gd);font-weight:bold;background:rgba(235,160,0,0.1);padding:1px 4px;border-radius:4px">$1</span>')
                .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#34b7f1;text-decoration:underline">$1</a>')+
             '</div>'+
             '<div class="pj-chat-time">'+timeStr+'</div>'+
           '</div>'+
           '</div>';
    });
    
    log.innerHTML=h;
    if(window.twemoji) {
        twemoji.parse(log, { folder: 'svg', ext: '.svg' });
    }
    // Smooth scroll to bottom
    setTimeout(function(){ log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' }); }, 50);
}

function tgChatSend(){
    var inp=document.getElementById('tgChatInput');
    if(!inp || !TG_USER) return;
    var text=(inp.value||'').trim();
    if(!text) return;
    inp.value='';
    inp.style.height='';
    var payload = {
        uid: TG_USER.uid, name: TG_USER.name||TG_USER.email, role: TG_USER.role||'employee',
        text: text, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (window._chatReplyTo) {
        payload.replyToId = window._chatReplyTo.id;
        payload.replyToName = window._chatReplyTo.name;
        payload.replyToText = window._chatReplyTo.text;
    }
    tgChatClearReply();
    db.collection('chatMessages').add(payload).then(function(){
        // إشعار كل المستخدمين الآخرين برسالة جديدة في الشات العام
        if(typeof tgBroadcastPush === 'function'){
            var preview = text.length > 60 ? text.slice(0, 60) + '…' : text;
            tgBroadcastPush('💬 رسالة من ' + (TG_USER.name||TG_USER.email), preview, 'chat-new', TG_USER.uid);
        }
    }).catch(function(err){ alert('تعذر إرسال الرسالة: '+err.message); });
}

function tgChatDelete(msgId){
    if(!confirm('حذف هذه الرسالة؟')) return;
    db.collection('chatMessages').doc(msgId).delete().catch(function(err){ alert('تعذر الحذف: '+err.message); });
}

// ─── شارة عدد الرسائل غير المقروءة على الفقاعة العائمة ────────────────
function tgChatLastReadKey(){ return TG_USER ? ('tg_chat_lastread_'+TG_USER.uid) : null; }
function tgChatGetLastRead(){
    var k=tgChatLastReadKey(); if(!k) return 0;
    return parseInt(localStorage.getItem(k))||0;
}
function tgChatMarkRead(){
    if(!_chatMessages.length) { updateChatBadge(0); return; }
    var last = _chatMessages[_chatMessages.length-1];
    var k=tgChatLastReadKey();
    if(k && last.createdAt && last.createdAt.toMillis) localStorage.setItem(k, last.createdAt.toMillis());
    updateChatBadge(0);
}

window._chatReplyTo = null;
function tgChatSetReply(msgId, name, text) {
    window._chatReplyTo = { id: msgId, name: name, text: text };
    var preview = document.getElementById('tgChatReplyPreview');
    var txt = document.getElementById('tgChatReplyText');
    if(preview && txt) {
        txt.innerHTML = '<strong>' + escH(name) + ':</strong> ' + escH(text.length > 60 ? text.substring(0, 60) + '...' : text);
        preview.style.display = 'flex';
    }
    var inp = document.getElementById('tgChatInput');
    if(inp) inp.focus();
}
function tgChatClearReply() {
    window._chatReplyTo = null;
    var preview = document.getElementById('tgChatReplyPreview');
    if(preview) preview.style.display = 'none';
}

function tgChatUpdateBadgeFromCache(){
    var lastRead=tgChatGetLastRead();
    var count=0;
    _chatMessages.forEach(function(m){
        if(!TG_USER || m.uid===TG_USER.uid) return;
        var t=(m.createdAt && m.createdAt.toDate) ? m.createdAt.toDate().getTime() : 0;
        if(t>lastRead) count++;
    });
    updateChatBadge(count);
}
function updateChatBadge(n){
    document.querySelectorAll('.tgChatBadge').forEach(function(el){
        if(n>0){ el.style.display='flex'; el.textContent = n>99?'99+':String(n); }
        else { el.style.display='none'; el.textContent=''; }
    });
}

function renderProjectChat(projectId, comments, containerId){
    var box=document.getElementById(containerId);
    if(!box)return;
    window._chatContainers[projectId]=containerId;
    var h='';
    if(!comments||!comments.length){
        h='<div class="pj-chat-empty">لا توجد ملاحظات بعد على هذا المشروع.</div>';
    }else{
        comments.forEach(function(c){
            var mine=TG_USER&&c.uid===TG_USER.uid;
            var canDelete=mine||(TG_USER&&(TG_USER.role==='admin'||TG_USER.role==='tech_admin'));
            var roleLabel=c.role==='admin'||c.role==='tech_admin'?'أدمن':'موظف';
            var timeStr='';
            if(c.createdAt&&c.createdAt.toDate){
                try{ timeStr=c.createdAt.toDate().toLocaleString('ar-EG',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}); }catch(e){}
            }
            // محتوى المرفق (صورة / فيديو / ملف)
            var attachHtml = '';
            if(c.fileUrl && c.fileType){
                if(c.fileType.indexOf('image/')===0){
                    attachHtml = '<div style="margin-top:6px"><a href="'+c.fileUrl+'" target="_blank"><img src="'+c.fileUrl+'" style="max-width:200px;max-height:160px;border-radius:8px;cursor:pointer;display:block" loading="lazy"></a></div>';
                } else if(c.fileType.indexOf('video/')===0){
                    attachHtml = '<div style="margin-top:6px"><video src="'+c.fileUrl+'" controls style="max-width:240px;border-radius:8px"></video></div>';
                } else {
                    attachHtml = '<div style="margin-top:6px"><a href="'+c.fileUrl+'" target="_blank" style="color:var(--nv);font-weight:700;text-decoration:underline">📎 '+escH(c.fileName||'ملف مرفق')+'</a></div>';
                }
            }
            h+='<div class="pj-chat-msg'+(mine?' mine':'')+'">'+
               '<div class="pj-chat-msg-h"><span class="pj-chat-name">'+escH(c.name||'')+'</span>'+
               '<span class="pj-chat-role">'+roleLabel+'</span>'+
               '<span class="pj-chat-time">'+escH(timeStr)+'</span>'+
               (canDelete?('<span class="pj-chat-del" title="حذف الملاحظة" onclick="deleteProjectComment(\''+c.id+'\',\''+projectId+'\')">🗑</span>'):'')+
               '</div>'+
               (c.text?'<div class="pj-chat-text">'+escH(c.text||'')+'</div>':'')+
               attachHtml+
               '</div>';
        });
    }
    box.innerHTML=h;
    box.scrollTop=box.scrollHeight;
}
function reloadProjectChat(projectId){
    db.collection('projectComments').where('projectId','==',projectId).get().then(function(snap){
        var list=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());})
            .sort(function(a,b){
                var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
                var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
                return am-bm;
            });
        renderProjectChat(projectId,list,window._chatContainers[projectId]);
    }).catch(function(err){ console.error('reloadProjectChat',err); });
}
function postProjectComment(projectId,inputId){
    var input=document.getElementById(inputId);
    if(!input||!TG_USER)return;
    var text=(input.value||'').trim();
    if(!text)return;
    input.disabled=true;
    db.collection('projectComments').add({
        projectId:projectId, uid:TG_USER.uid, name:TG_USER.name, role:TG_USER.role,
        text:text, createdAt:firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(){
        input.value=''; input.disabled=false; input.focus();
        reloadProjectChat(projectId);
        // إشعار الأدمن
        if(TG_USER && TG_USER.role === 'employee'){
            db.collection('projects').doc(projectId).get().then(function(doc){
                var pTitle = doc.exists ? doc.data().title : 'مشروع';
                tgNotifyAdmins('💬 ملاحظة جديدة على مشروع', (TG_USER.name||'موظف') + ' أضاف ملاحظة في: ' + pTitle, 'project-note');
            }).catch(function(){});
        }
    }).catch(function(err){ input.disabled=false; alert('تعذر إضافة الملاحظة: '+err.message); });
}
function deleteProjectComment(commentId,projectId){
    if(!confirm('حذف هذه الملاحظة من المشروع؟'))return;
    db.collection('projectComments').doc(commentId).delete().then(function(){
        reloadProjectChat(projectId);
    }).catch(function(err){ alert('تعذر حذف الملاحظة: '+err.message); });
}
function projectChatHtml(projectId,logId,inputId){
    return '<div class="proj-sec-title">📝 ملاحظات المشروع</div>'+
       '<div class="pj-chat">'+
       '<div class="pj-chat-log" id="'+logId+'"></div>'+
       '<div class="pj-chat-input-row">'+
       '<textarea id="'+inputId+'" placeholder="اكتب ملاحظة على المشروع..." rows="2" onkeydown="if(event.key===\'Enter\' && !event.shiftKey){event.preventDefault();postProjectComment(\''+projectId+'\',\''+inputId+'\')}"></textarea>'+
       '<button class="bt bt-p" onclick="postProjectComment(\''+projectId+'\',\''+inputId+'\')">➕ إضافة</button>'+
       '</div></div>';
}
function renderProjectsList(list){
    var box=document.getElementById('pmgmtList');
    if(!box)return;
    if(!list.length){
        box.innerHTML='<div class="empty-hint">لا توجد مشاريع بعد. أنشئ أول مشروع من الأعلى.</div>';
        return;
    }

    var f = document.getElementById('tgProjsEmpFilter');
    if(f && typeof PMGMT_EMPLOYEES !== 'undefined') {
        var empSet = new Set();
        list.forEach(function(p) {
            if(p.assignees && p.assignees.length > 0) {
                var emp = PMGMT_EMPLOYEES.find(function(e){return e.uid===p.assignees[0];});
                if(emp && emp.name) empSet.add(emp.name);
            }
        });
        var curVal = f.value;
        var opts = '<option value="">الكل (تصفية بالموظف)</option>';
        Array.from(empSet).sort(function(a,b){return a.localeCompare(b,'ar')}).forEach(function(e) {
            opts += '<option value="'+escH(e)+'">'+escH(e)+'</option>';
        });
        f.innerHTML = opts;
        f.value = curVal;
        setTimeout(function(){ tgFilterByEmployee(f.value, 'staff-card'); }, 50);
    }

    list.sort(function(a,b){
        var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
        var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
        return bm-am;
    });
    var h='';
    window._pmgmtProjCache = list;
    list.forEach(function(p,idx){
        var assignees=p.assignees||[];
        var sum=0;
        assignees.forEach(function(uid){
            var pm=(p.progressMap&&p.progressMap[uid])?p.progressMap[uid].progress:0;
            sum+=(pm||0);
        });
        var avgProg=assignees.length?Math.round(sum/assignees.length):0;

        var dVal = (p.createdAt && p.createdAt.toMillis) ? p.createdAt.toMillis() : ((p.createdAt && new Date(p.createdAt).getTime()) || 0);
        var sVal = p.status === 'مكتمل' ? 3 : (p.status === 'متوقف' ? 1 : 2); // default 2
        var pVal = p.priority === 'عالية' ? 3 : (p.priority === 'متوسطة' ? 2 : 1);
        var dlVal = p.deadline ? new Date(p.deadline).getTime() : 9999999999999;
        var empVal = p.assignees && p.assignees.length > 0 ? escH(PMGMT_EMPLOYEES.find(function(e){return e.uid===p.assignees[0];})?.name || '') : '';

        h+='<div class="staff-card" id="pmCard'+idx+'" data-date="'+dVal+'" data-status="'+sVal+'" data-prio="'+pVal+'" data-deadline="'+dlVal+'" data-emp="'+empVal+'">';
        h+='<div class="staff-card-h" onclick="toggleProjCard('+idx+')">'+
           '<div><div class="staff-name">'+escH(p.title||'بدون عنوان')+'</div>'+
           (p.description?'<div class="staff-email">'+tgMakeExpandable(p.description, 100)+'</div>':'')+
           projectTagsHtml(p)+
           '<div class="pj-meta" style="margin-top:4px;font-size:10px;color:var(--tx3)">بواسطة: '+escH(p.createdBy||'الإدارة')+' ('+escH(p.createdByRole||'أدمن إداري')+')</div>'+
           '</div>'+
           '<div class="staff-stats">'+
           '<span class="staff-stat">👥 '+assignees.length+' موظف</span>'+
           '<span class="staff-stat">📊 متوسط تقدم '+avgProg+'%</span>'+
           '</div></div>';
        h+='<div class="staff-card-body">';

        if(p.fileUrl || p.linkUrl){
            h+='<div class="proj-sec"><div class="proj-sec-title">📎 المرفقات والروابط</div>';
            if(p.fileUrl){
                var fType = p.fileType || '';
                if(fType.indexOf('image/')===0){
                    h+='<a href="'+p.fileUrl+'" target="_blank"><img src="'+p.fileUrl+'" style="max-width:100%;max-height:200px;border-radius:6px;display:block;margin-bottom:8px"></a>';
                } else if(fType.indexOf('video/')===0){
                    h+='<video src="'+p.fileUrl+'" controls style="max-width:100%;max-height:200px;border-radius:6px;margin-bottom:8px"></video>';
                } else {
                    h+='<a href="'+p.fileUrl+'" target="_blank" style="color:var(--tx);font-weight:700;text-decoration:underline;display:block;margin-bottom:8px">📎 '+escH(p.fileName||'ملف مرفق')+'</a>';
                }
            }
            if(p.linkUrl){
                h+='<a href="'+escH(p.linkUrl)+'" target="_blank" style="color:var(--gd);font-weight:700;text-decoration:underline;font-size:13px;display:block">🔗 رابط خارجي للمشروع</a>';
            }
            h+='</div>';
        }

        h+='<div class="proj-sec"><div class="proj-sec-title">👥 الموظفون المسؤولون</div>';
        if(assignees.length){
            assignees.forEach(function(uid){
                var e=PMGMT_EMPLOYEES.find(function(x){return x.uid===uid;});
                var nm=e?(e.name||e.email):'(موظف غير موجود حالياً)';
                var pm=(p.progressMap&&p.progressMap[uid])||{progress:0,status:'لم يبدأ',note:''};
                h+='<div class="pj-row"><div class="pj-t">'+escH(nm)+'</div>'+
                   '<div class="pj-bar"><div class="pj-bar-in" style="width:'+(pm.progress||0)+'%"></div></div>'+
                   '<div class="pj-meta">الحالة: <span class="badge '+badgeClassForStatus(pm.status)+'">'+escH(pm.status||'لم يبدأ')+'</span> · التقدم: '+(pm.progress||0)+'%'+(pm.note?(' · ملاحظة: '+tgMakeExpandable(pm.note, 80)):'')+'</div></div>';
            });
        }else h+='<div class="empty-hint">لم يتم تعيين أي موظف على هذا المشروع بعد.</div>';
        h+='</div>';

        h+='<div class="proj-sec">'+projectChatHtml(p.id,'pmChatLog'+idx,'pmChatInput'+idx)+'</div>';

        h+='<div class="proj-sec"><div class="proj-sec-title">⚙️ إدارة المشروع</div>';
        h+='<div style="display:flex;gap:8px;flex-wrap:wrap">'+
           (p.status !== 'مكتمل' ? '<button class="bt bt-ok" onclick="quickCompleteProject(\''+p.id+'\')">✅ إنهاء المشروع</button>' : '')+
           '<button class="bt bt-o" onclick="toggleProjEdit('+idx+')">✏️ تعديل المشروع</button>'+
           '<button class="bt bt-o" onclick="printProjectDoc(window._pmgmtProjCache['+idx+'])">🖨 طباعة المشروع</button>'+
           '<button class="bt bt-d" onclick="deleteProject(\''+p.id+'\')">🗑 حذف المشروع</button>'+
           '</div>';

        h+='<div id="pmEdit'+idx+'" style="display:none;margin-top:14px;padding-top:14px;border-top:1px dashed var(--bd2)">'+
           '<div class="fg" style="margin-bottom:10px"><label>عنوان المشروع</label><input type="text" id="pmEditTitle'+idx+'" value="'+escH(p.title||'')+'"></div>'+
           '<div class="fg fg-full" style="margin-bottom:10px"><label>وصف مختصر</label><textarea rows="2" id="pmEditDesc'+idx+'">'+escH(p.description||'')+'</textarea></div>'+
           '<div class="fr fr3" style="margin-bottom:10px">'+
           '<div class="fg"><label>الأولوية</label><select id="pmEditPriority'+idx+'">'+
             ['منخفضة','متوسطة','عالية'].map(function(s){return '<option'+((p.priority||'متوسطة')===s?' selected':'')+'>'+s+'</option>';}).join('')+
           '</select></div>'+
           '<div class="fg"><label>حالة المشروع</label><select id="pmEditStatus'+idx+'">'+
             ['مخطط له','جاري العمل','متوقف','مكتمل'].map(function(s){return '<option'+((p.status||'مخطط له')===s?' selected':'')+'>'+s+'</option>';}).join('')+
           '</select></div>'+
           '<div class="fg"><label>تاريخ الاستحقاق</label><input type="date" id="pmEditDeadline'+idx+'" value="'+escH(p.deadline||'')+'"></div>'+
           '</div>'+
           '<div class="fg fg-full" style="margin-bottom:6px"><label>الموظفون المسؤولون</label></div>'+
           '<div class="chk-grid" id="pmEditAssignees'+idx+'">'+PMGMT_EMPLOYEES.map(function(e){
                var checked=assignees.indexOf(e.uid)>-1?' checked':'';
                return '<label><input type="checkbox" class="pm-edit-assignee-chk"'+checked+' value="'+e.uid+'"> '+escH(e.name||e.email)+'</label>';
           }).join('')+'</div>'+
           '<div style="display:flex;gap:8px;margin-top:10px">'+
           '<button class="bt bt-p" onclick="saveProjectEdit(\''+p.id+'\','+idx+')">💾 حفظ التعديلات</button>'+
           '<button class="bt bt-o" onclick="toggleProjEdit('+idx+')">إلغاء</button>'+
           '</div>'+
           '<div id="pmEditMsg'+idx+'" style="margin-top:8px;font-size:11px"></div>'+
           '</div>';
        h+='</div>'; // proj-sec إدارة المشروع

        h+='</div></div>';
    });
    box.innerHTML=h;
    list.forEach(function(p,idx){
        renderProjectChat(p.id,p.comments||[],'pmChatLog'+idx);
    });
}
function toggleProjCard(idx){
    var c=document.getElementById('pmCard'+idx);
    if(c)c.classList.toggle('open');
}
function toggleProjEdit(idx){
    var e=document.getElementById('pmEdit'+idx);
    if(!e)return;
    e.style.display=(e.style.display==='none'||!e.style.display)?'block':'none';
}
function saveProjectEdit(id,idx){
    var title=(document.getElementById('pmEditTitle'+idx).value||'').trim();
    var desc=(document.getElementById('pmEditDesc'+idx).value||'').trim();
    var priority=document.getElementById('pmEditPriority'+idx).value;
    var status=document.getElementById('pmEditStatus'+idx).value;
    var deadline=document.getElementById('pmEditDeadline'+idx).value||'';
    var msg=document.getElementById('pmEditMsg'+idx);
    if(!title){ msg.style.color='var(--no)'; msg.textContent='من فضلك اكتب عنوان المشروع.'; return; }
    var checked=Array.prototype.slice.call(document.querySelectorAll('#pmEditAssignees'+idx+' .pm-edit-assignee-chk:checked')).map(function(c){return c.value;});
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('projects').doc(id).update({title:title,description:desc,assignees:checked,priority:priority,status:status,deadline:deadline}).then(function(){
        msg.style.color='var(--ok)'; msg.textContent='✅ تم الحفظ';
        if(status === 'مكتمل') tgCelebrate();
        loadPmgmtData();
    }).catch(function(err){
        msg.style.color='var(--no)'; msg.textContent='❌ تعذر الحفظ: '+err.message;
    });
}
function quickCompleteProject(id){
    if(!confirm('هل أنت متأكد من رغبتك في إنهاء هذا المشروع وإبلاغ جميع الموظفين؟')) return;
    db.collection('projects').doc(id).get().then(function(doc){
        if(!doc.exists) return;
        var p = doc.data();
        db.collection('projects').doc(id).update({status:'مكتمل'}).then(function(){
            tgCelebrate();
            loadPmgmtData();
            
            // إرسال إعلان رسمي بانتهاء المشروع
            var title = '🎉 انتهاء مشروع: ' + p.title;
            var content = 'تم بحمد الله الانتهاء من مشروع "' + p.title + '" بنجاح. شكراً لجميع الموظفين الذين ساهموا في هذا الإنجاز! ✨';
            var date = new Date().toISOString().split('T')[0];
            
            db.collection('announcements').add({
                title: title,
                date: date,
                content: content,
                createdAt: new Date(),
                createdBy: TG_USER ? (TG_USER.name || TG_USER.email) : 'الإدارة',
                createdByRole: (TG_USER && TG_USER.role === 'tech_admin') ? 'أدمن تقني' : 'أدمن إداري'
            }).then(function(){
                if(typeof tgBroadcastPush === 'function'){
                    tgBroadcastPush('🎊 إنجاز جديد!', 'تم الانتهاء من مشروع: ' + p.title, 'project-completed', TG_USER ? TG_USER.uid : '');
                }
            });
        });
    }).catch(function(err){
        alert('تعذر إنهاء المشروع: '+err.message);
    });
}
function deleteProject(id){
    if(!confirm('حذف هذا المشروع نهائياً؟ لا يمكن التراجع عن هذا الإجراء.'))return;
    db.collection('projects').doc(id).delete().then(loadPmgmtData).catch(function(err){
        alert('تعذر حذف المشروع: '+err.message);
    });
}

function setD(c){
    var t=new Date().toISOString().split("T")[0];
    c.querySelectorAll('input[type="date"]').forEach(function(i){if(!i.value)i.value=t});
}
function toggleAnon(cb){
    var d=document.getElementById("cud");
    if(cb.checked){d.style.opacity="0.3";d.style.pointerEvents="none"}
    else{d.style.opacity="1";d.style.pointerEvents="auto"}
}

// ─── HTML BUILDERS ────────────────────────────────────────────────────────
// تنسيق موحّد لكل المستندات — يعتمد تصميم "الخطاب الرسمي" (FL) مع لوجو الشركة الفعلي
// ext=true: مستند خارجي (يُسلَّم لجهة خارج الشركة) — يأخذ برواز رسمي مزدوج عند الطباعة
function H(title,sub,en,docId,ext){
    var num=docId?genDocNum(docId):'';
    var today = new Date();
    var ddStr = ('0' + today.getDate()).slice(-2) + '/' + ('0' + (today.getMonth()+1)).slice(-2) + '/' + today.getFullYear();
    var h='<div class="FL'+(ext?' FL-external':'')+'">';
    h+='<div class="FL-head">'+
       '<div class="FL-brand">'+
       '<img class="FL-logo" src="'+LOGO_URI+'" alt="Tech Go">'+
       '<div class="FL-brand-text"><div class="FL-brand-ar dcn"></div><div class="FL-brand-sub">'+sub+'</div></div>'+
       '</div>'+
       '<div class="FL-doctype">'+title+(en?'<span class="FL-doctype-en">'+en+'</span>':'')+'</div>'+
       '</div>';
    h+='<div class="FL-rule"></div>';
    h+='<div class="FL-meta">'+
       '<div class="FL-meta-item"><span class="FL-meta-lbl">رقم المستند</span><input type="text" class="FL-meta-val doc-num-fld" value="'+escH(num)+'"></div>'+
       '<div class="FL-meta-item"><span class="FL-meta-lbl">التاريخ</span><input type="text" class="FL-meta-val FL-date-str" value="'+ddStr+'"></div>'+
       '</div>';
    h+='<div class="FL-body">';
    return h;
}
function FT(copies){
    var cp=copies||['نسخة للموظف','نسخة للإدارة','نسخة للأرشيف'];
    var sp='';for(var i=0;i<cp.length;i++)sp+='<span>'+cp[i]+'</span>';
    return '</div><div style="break-inside: avoid; page-break-inside: avoid;"><div class="FL-foot">'+
    '<span>شركة تيك – جو | وثيقة سرية تُحفظ في ملف الموظف</span>'+
    '<span class="FL-foot-ts print-only-ts"></span>'+
    '<span class="FL-foot-ref print-only-ts"></span>'+
    '<span class="FL-foot-copies">'+sp+'</span>'+
    '</div>'+
    '<div style="text-align:center;font-size:8px;color:var(--tx3);padding:4px 0 2px;border-top:1px solid var(--bd);margin-top:2px">تطوير وتصميم: أبانوب فايز</div>'+
    '</div></div>';
}

function SC(n,t){return '<div class="sec"><div class="num">'+n+'</div><div class="stx">'+t+'</div></div>'}

function _sig(title,name,sub,id){
    var nm=name?'<div class="sig-nm">'+escH(name)+'</div>':'<div class="sig-nm-ph"></div>';
    var ia=id?' id="'+id+'"':'';
    return '<div class="sig"'+ia+'>'+
        '<div class="st">'+title+'</div>'+nm+
        '<div class="ss">'+sub+'</div>'+
        '<div class="sl"></div>'+
        '<div class="sd">التاريخ: ..................</div>'+
        '</div>';
}

function tgNotifyAdmins(title, body, tag) {
    if (typeof tgSendPushToUser !== 'function') return;
    db.collection('users').where('role', 'in', ['admin', 'tech_admin']).get().then(function(snap) {
        snap.forEach(function(d) {
            tgSendPushToUser(d.id, title, body, tag);
        });
    }).catch(function(err) { console.error('Notification Error:', err); });
}

// توقيع بتصميم الخطاب الرسمي الجديد (FL) — يُستخدم في الخطاب الإداري العام
function _sigFL(role,name,sub,id){
    var nm=name?'<div class="FL-sig-name">'+escH(name)+'</div>':'<div class="FL-sig-name">&nbsp;</div>';
    var ia=id?' id="'+id+'"':'';
    return '<div class="FL-sig"'+ia+'>'+
        '<div class="FL-sig-role">'+role+'</div>'+
        '<div class="FL-sig-sub">'+sub+'</div>'+
        nm+
        '<div class="FL-sig-line"></div>'+
        '<div class="FL-sig-date">التاريخ: ..................</div>'+
        '</div>';
}
function SG3(a,sa,b,sb,c,sc,ar,br,cr){
    return '<div class="sigs">'+
        _sig(a,ar?MGRS[ar]:'',sa)+
        _sig(b,br?MGRS[br]:'',sb)+
        _sig(c,cr?MGRS[cr]:'',sc)+
        '</div>';
}
function SG2(a,sa,b,sb,ar,br){
    return '<div class="sigs sigs2">'+
        _sig(a,ar?MGRS[ar]:'',sa)+
        _sig(b,br?MGRS[br]:'',sb)+
        '</div>';
}
function F2(a,b){return '<div class="fr fr2">'+a+b+'</div>'}
function F3(a,b,c){return '<div class="fr fr3">'+a+b+c+'</div>'}
function FG(l,t,p){return '<div class="fg"><label>'+l+'</label><input type="'+(t||"text")+'"'+(p?' placeholder="'+p+'"':'')+'></div>'}
// حقل اسم موظف: يظهر كدروب ليست (Autocomplete) من قائمة الموظفين المحفوظة، مع إمكانية الكتابة اليدوية
function FGE(l){return '<div class="fg"><label>'+l+'</label><input type="text" class="emp-name-fld" list="tgEmpDL" autocomplete="off" onchange="addEmployeeName(this.value)"></div>'}
function FGA(l,r,p){return '<div class="fg fg-full"><label>'+l+'</label><textarea rows="'+(r||3)+'"'+(p?' placeholder="'+p+'"':'')+'></textarea></div>'}
function FGS(l,opts){var o='<option value="" selected></option>';for(var i=0;i<opts.length;i++)o+='<option>'+opts[i]+'</option>';return '<div class="fg"><label>'+l+'</label><select>'+o+'</select></div>'}

// ─── طباعة موحدة لمستندات الموظف (تُستخدم من لوحة الأدمن وبوابة الموظف معاً) ──
// تبحث عن إطار طباعة مخفي بمعرّف tgPrintFrame في الصفحة الحالية (موجود في index.html و employee.html)
function tgLine(lbl,val){
    var v = escH(val||'');
    var isLong = v.length > 50;
    return '<div class="FL-line" style="display:'+(isLong?'block':'flex')+'; align-items:baseline; gap:10px; margin-bottom:12px; border-bottom:1px solid var(--bd2)">'+
           '<span class="FL-line-lbl" style="font-weight:bold; color:var(--tx2); '+(isLong?'display:block; margin-bottom:4px':'flex-shrink:0')+'">'+lbl+':</span>'+
           '<div class="FL-line-val" style="'+(isLong?'display:block; width:100%':'flex:1')+'; white-space:pre-wrap; word-break:break-word; font-size:12px; color:var(--tx); padding:2px 4px">'+v+'</div></div>';
}
function tgBlock(val){
    return '<div class="FL-textbody" style="min-height:60px; white-space:pre-wrap; word-break:break-word; overflow-wrap:break-word;">'+escH(val||'')+'</div>';
}
// إبقاء الأسماء القديمة كمرادفات (متوافقة مع الكود القديم في بوابة الموظف)
function empLine(lbl,val){ return tgLine(lbl,val); }
function empBlock(val){ return tgBlock(val); }
function printDoc(bodyHtml, docTitle){
    var ifr=document.getElementById('tgPrintFrame');
    if(!ifr)return;
    fetch('styles.css?v='+Date.now()).then(function(res){return res.text();}).then(function(css){
        var doc=ifr.contentWindow.document;
        var fullHtml = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">'+
            (docTitle ? '<title>'+docTitle+'</title>' : '') +
            '<style>'+css+'</style></head><body>'+bodyHtml+'</body></html>';
            
        if(window.TG_USER && (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin')) {
            var tmp = document.createElement('div');
            tmp.innerHTML = bodyHtml;
            var empName = 'غير محدد';
            var nFld = tmp.querySelector('input[data-fid="name"]');
            if(nFld && nFld.value) empName = nFld.value;
            else {
                var lineLbls = tmp.querySelectorAll('.FL-line-lbl');
                for(var i=0; i<lineLbls.length; i++){
                    if(lineLbls[i].textContent.indexOf('الاسم') > -1 || lineLbls[i].textContent.indexOf('الموظف') > -1) {
                        var nVal = lineLbls[i].nextElementSibling;
                        if(nVal && nVal.textContent) { empName = nVal.textContent.trim(); break; }
                    }
                }
            }
            db.collection('docArchive').add({
                docTitle: docTitle || 'مستند',
                employeeName: empName,
                htmlContent: fullHtml,
                createdAt: new Date(),
                savedBy: TG_USER.uid
            }).catch(function(e){ console.error('Archive err:', e); });
        }

        doc.open();
        doc.write(fullHtml);
        doc.close();
        doc.querySelectorAll('.dcn').forEach(function(e){e.innerText=CN;});
        setTimeout(function(){
            var oldTitle = document.title;
            if(docTitle) document.title = docTitle;
            ifr.contentWindow.focus();
            ifr.contentWindow.print();
            if(docTitle) document.title = oldTitle;
        },500);
    }).catch(function(err){
        console.error('Failed to load CSS for print', err);
    });
}
function printWeeklyReportDoc(u,r){
    var h=H('تقرير أسبوعي','تقرير أداء أسبوعي مُرسل من الموظف','WEEKLY WORK REPORT','wkr');
    h+=SC('١','بيانات الموظف');
    h+=tgLine('اسم الموظف',u.name);
    if(u.email)h+=tgLine('البريد الإلكتروني',u.email);
    h+=tgLine('بداية الأسبوع',r.weekStart);
    h+=SC('٢','ملخص الأسبوع');
    h+=tgBlock(r.content);
    h+=FT(['نسخة للموظف','نسخة للإدارة']);
    var docTitle = 'تقرير أسبوعي' + (u.name ? ' - ' + u.name : '');
    printDoc(h, docTitle);
}

// ─── بريد التقارير الأسبوعية (Inbox) ───────────────────────────────────────
function loadWeeklyReportsInbox(){
    var listEl = document.getElementById('wkrInboxList');
    Promise.all([
        db.collection('weeklyReports').orderBy('createdAt','desc').get(),
        db.collection('users').where('role','in',['employee','tech_admin']).get()
    ]).then(function(res){
        var reports = res[0].docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
        var users = {};
        var empList = [];
        res[1].forEach(function(d){ var u=d.data(); u.uid=d.id; users[d.id]=u; empList.push(u); });
        empList.sort(function(a,b){ return (a.name||a.email||'').localeCompare(b.name||b.email||''); });
        window._wkrInboxData = reports;
        window._wkrInboxUsers = users;

        var empSel = document.getElementById('wkrInboxEmpFilter');
        if(empSel){
            empList.forEach(function(u){
                var opt = document.createElement('option');
                opt.value = u.uid; opt.textContent = u.name || u.email;
                empSel.appendChild(opt);
            });
        }

        var weekSel = document.getElementById('wkrInboxWeekFilter');
        if(weekSel){
            var weeks = [];
            reports.forEach(function(r){ if(r.weekStart && weeks.indexOf(r.weekStart)===-1) weeks.push(r.weekStart); });
            weeks.sort().reverse();
            weeks.forEach(function(w){
                var opt = document.createElement('option');
                opt.value = w; opt.textContent = 'أسبوع '+w;
                weekSel.appendChild(opt);
            });
        }

        renderWeeklyReportsInbox();
    }).catch(function(err){
        if(listEl) listEl.innerHTML = '<div class="empty-hint" style="color:var(--no)">تعذر تحميل التقارير: '+escH(err.message)+'</div>';
    });
}
function renderWeeklyReportsInbox(){
    var reports = window._wkrInboxData || [];
    
    // إزالة التكرار: نحتفظ بأحدث تقرير لكل موظف لكل أسبوع (التقارير مرتبة مسبقاً بالأحدث)
    var uniqueReports = [];
    var seen = {};
    reports.forEach(function(r){
        var key = r.uid + '_' + r.weekStart;
        if(!seen[key]){
            seen[key] = true;
            uniqueReports.push(r);
        }
    });
    reports = uniqueReports;

    var users = window._wkrInboxUsers || {};
    var empFilter = (document.getElementById('wkrInboxEmpFilter')||{}).value || 'all';
    var weekFilter = (document.getElementById('wkrInboxWeekFilter')||{}).value || 'all';
    var statusFilter = (document.getElementById('wkrInboxStatusFilter')||{}).value || 'all';

    var filtered = reports.filter(function(r){
        if(empFilter!=='all' && r.uid!==empFilter) return false;
        if(weekFilter!=='all' && r.weekStart!==weekFilter) return false;
        if(statusFilter==='unreviewed' && r.reviewedByAdmin) return false;
        if(statusFilter==='reviewed' && !r.reviewedByAdmin) return false;
        return true;
    });
    window._wkrInboxFiltered = filtered;

    var unreviewedTotal = reports.filter(function(r){ return !r.reviewedByAdmin; }).length;
    var statsEl = document.getElementById('wkrInboxStats');
    if(statsEl){
        statsEl.innerHTML =
            '<div style="background:var(--w);padding:8px 16px;border-radius:10px;border:1px solid var(--bd);font-size:12px;font-weight:700;color:var(--tx2)">📥 إجمالي التقارير: '+reports.length+'</div>'+
            '<div style="background:var(--w);padding:8px 16px;border-radius:10px;border:1px solid var(--bd);font-size:12px;font-weight:700;color:'+(unreviewedTotal?'var(--no)':'var(--ok)')+'">⏳ غير مراجَعة: '+unreviewedTotal+'</div>';
    }

    var listEl = document.getElementById('wkrInboxList');
    if(!listEl) return;
    if(!filtered.length){ listEl.innerHTML='<div class="empty-hint">لا توجد تقارير مطابقة لهذا الفلتر.</div>'; return; }

    var h='';
    filtered.forEach(function(r,i){
        var u = users[r.uid] || {name:r.name, email:r.email};
        var waMsg = encodeURIComponent('التقرير الأسبوعي - '+(u.name||r.name||'')+'\n'+'الأسبوع: '+(r.weekStart||'')+'\n---\n'+(r.content||''));
        h+='<div class="ac-row" style="border-right:3px solid '+(r.reviewedByAdmin?'var(--ok)':'var(--no)')+'">'+
           '<div class="ac-t" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center">'+
           '<span>👤 '+escH(u.name||u.email||'موظف')+' — أسبوع '+escH(r.weekStart||'')+'</span>'+
           '<span style="display:flex;gap:6px;flex-wrap:wrap">'+
           (r.reviewedByAdmin ? '<span class="badge" style="background:var(--ok);color:#fff">✅ تمت المراجعة</span>' :
              '<button class="bt bt-g" style="padding:2px 10px;font-size:10px" onclick="markWeeklyReportReviewed(\''+r.id+'\',this)">✔ تحديد كمراجَع</button>')+
           ' <button class="bt bt-o" style="padding:2px 8px;font-size:10px" onclick="printWeeklyReportInboxItem('+i+')">🖨 طباعة</button>'+
           ' <a href="https://wa.me/?text='+waMsg+'" target="_blank" class="bt bt-g" style="padding:2px 8px;font-size:10px;text-decoration:none">📲 واتساب</a>'+
           '</span></div>'+
           (r.content?'<div class="ac-meta">'+tgMakeExpandable(escH(r.content),160)+'</div>':'')+
           '</div>';
    });
    listEl.innerHTML = h;
}
function printWeeklyReportInboxItem(i){
    var r = (window._wkrInboxFiltered||[])[i];
    if(!r) return;
    var u = (window._wkrInboxUsers||{})[r.uid] || {name:r.name, email:r.email};
    printWeeklyReportDoc(u, r);
}
function markWeeklyReportReviewed(id, btn){
    if(btn){ btn.disabled = true; btn.textContent = '⏳ ...'; }
    db.collection('weeklyReports').doc(id).update({ reviewedByAdmin:true, reviewedAt:new Date() }).then(function(){
        var rep = (window._wkrInboxData||[]).filter(function(x){ return x.id===id; })[0];
        if(rep) rep.reviewedByAdmin = true;
        renderWeeklyReportsInbox();
        if(typeof tgToast === 'function') tgToast('✅ تم تحديد التقرير كمراجَع', 'ok');
    }).catch(function(err){
        if(btn){ btn.disabled = false; btn.textContent = '✔ تحديد كمراجَع'; }
        if(typeof tgToast === 'function') tgToast('❌ '+err.message, 'err');
    });
}

function printAchievementDoc(u,a){
    var h=H('توثيق إنجاز','إنجاز مُسجّل من الموظف','ACHIEVEMENT RECORD','ach');
    h+=SC('١','بيانات الموظف');
    h+=tgLine('اسم الموظف',u.name);
    h+=tgLine('عنوان الإنجاز',a.title);
    h+=tgLine('التاريخ',a.date);
    h+=SC('٢','وصف الإنجاز');
    h+=tgBlock(a.description);
    h+=FT(['نسخة للموظف','نسخة للإدارة']);
    var docTitle = 'توثيق إنجاز' + (u.name ? ' - ' + u.name : '');
    printDoc(h, docTitle);
}
function printRequestDoc(u,r){
    if (r.dynamicData && r.formTemplateId && window.FS_OFFICIAL && window.FS_OFFICIAL[r.formTemplateId] && typeof window.FS_OFFICIAL[r.formTemplateId].print === 'function') {
        var dh = H('نموذج موظف', window.FS_TEMPLATES[r.formTemplateId].title, 'EMPLOYEE FORM', 'req');
        dh += window.FS_OFFICIAL[r.formTemplateId].print(r.dynamicData);
        var dTitle = (window.FS_TEMPLATES[r.formTemplateId].title) + (u.name ? ' - ' + u.name : '');
        printDoc(dh, dTitle);
        return;
    }

    var h=H('طلب موظف','طلب مُقدَّم من الموظف','EMPLOYEE REQUEST','req');
    h+=SC('١','بيانات الطلب');
    h+=tgLine('اسم الموظف',u.name);
    h+=tgLine('نوع الطلب',r.type);
    h+=tgLine('الحالة', r.status==='approved'?'موافق عليه':(r.status==='rejected'?'مرفوض':'قيد المراجعة'));
    if(r.fromDate) h+=tgLine('من تاريخ',r.fromDate);
    if(r.toDate) h+=tgLine('إلى تاريخ',r.toDate);
    if(r.reviewedBy) h+=tgLine('تمت المراجعة بواسطة',r.reviewedBy);
    
    h+=SC('٢','تفاصيل الطلب');
    if (r.dynamicData) {
        var tpl = window.FS_TEMPLATES && r.formTemplateId ? window.FS_TEMPLATES[r.formTemplateId] : null;
        var fieldLabels = {};
        if(tpl && tpl.fields) { tpl.fields.forEach(function(f){ fieldLabels[f.id] = f.label; }); }
        for(var k in r.dynamicData){
            var v = r.dynamicData[k];
            if(v === true) v = 'نعم / تم';
            if(v === false) v = 'لا';
            var lbl = fieldLabels[k] || k;
            if(lbl === 'chk1') lbl = 'تسليم العهدة المالية';
            if(lbl === 'chk2') lbl = 'تسليم العهدة العينية';
            if(lbl === 'chk3') lbl = 'تسليم المستندات والملفات';
            if(lbl === 'chk4') lbl = 'إنهاء المهام المعلقة';
            h+=tgLine(lbl, v);
        }
    } else {
        h+=tgBlock(r.details);
    }
    
    h+=FT(['نسخة للموظف','نسخة للإدارة']);
    var docTitle = 'طلب موظف' + (u.name ? ' - ' + u.name : '');
    printDoc(h, docTitle);
}
function printProjectDoc(p){
    if(!p) return;
    // Fetch project comments first
    db.collection('projectComments').where('projectId','==',p.id).get().then(function(snap){
        var comments = snap.docs.map(function(d){ return d.data(); })
            .sort(function(a,b){
                var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
                var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
                return am-bm;
            });
        
        var h=H('تقرير مشروع','تقرير حالة المشروع وتحديثات الموظفين','PROJECT STATUS REPORT','proj');
        h+=SC('١','بيانات المشروع');
        h+=tgLine('اسم المشروع', p.title||'');
        if(p.description) h+=tgLine('الوصف', p.description);
        h+=tgLine('الأولوية', p.priority||'متوسطة');
        h+=tgLine('حالة المشروع', p.status||'مخطط له');
        if(p.deadline) h+=tgLine('تاريخ الاستحقاق', p.deadline);
        if(p.createdBy) h+=tgLine('أنشئ بواسطة', p.createdBy);
        h+=SC('٢','تقدّم الموظفين');
        var assignees = p.assignees||[];
        if(assignees.length){
            assignees.forEach(function(uid){
                var e = (PMGMT_EMPLOYEES||[]).find(function(x){return x.uid===uid;});
                var nm = e ? (e.name||e.email) : uid;
                var pm = (p.progressMap&&p.progressMap[uid])||{progress:0,status:'لم يبدأ',note:''};
                h+=tgLine('الموظف', nm);
                h+=tgLine('نسبة الإنجاز', (pm.progress||0)+'%');
                h+=tgLine('الحالة', pm.status||'لم يبدأ');
                if(pm.note) h+=tgLine('ملاحظة', pm.note);
                h+='<div style="border-bottom:1px dashed #ccc;margin:8px 0"></div>';
            });
        } else {
            h+=tgLine('الموظفون', 'لم يتم تعيين موظفين بعد');
        }
        
        // Add project comments to the report
        if(comments.length){
            h+=SC('٣','ملاحظات وتحديثات المشروع');
            comments.forEach(function(c){
                var roleLabel = (c.role==='admin'||c.role==='tech_admin')?'أدمن':'موظف';
                var timeStr = '';
                if(c.createdAt&&c.createdAt.toDate){
                    try{ timeStr=c.createdAt.toDate().toLocaleString('ar-EG'); }catch(e){}
                }
                var cHeader = escH(c.name||'') + ' ('+roleLabel+')' + (timeStr?' - '+timeStr:'');
                h+=tgLine(cHeader, c.text||'مرفق');
            });
        }

        h+=FT(['نسخة للإدارة','نسخة للأرشيف']);
        var docTitle = 'تقرير مشروع' + (p.title ? ' - ' + p.title : '');
        printDoc(h, docTitle);
    }).catch(function(err){
        console.error('Error fetching comments for print', err);
        alert('حدث خطأ أثناء تحميل بيانات التقرير للطباعة.');
    });
}

// ─── حسابي — إعدادات شخصية مشتركة (تعمل للأدمن والموظف على حدٍّ سواء) ───────
function myAccountHTML(){
    var u=TG_USER||{};
    var h='<div class="SP"><h3>👤 حسابي</h3>';
    h+='<div class="set-hint">عدّل اسمك الظاهر في النظام، أو غيّر كلمة مرور حسابك. هذه الإعدادات خاصة بحسابك أنت فقط.</div>';

    h+='<div class="set-sec"><div class="set-sec-title">🧑 البيانات الشخصية</div>';
    h+='<div class="fg" style="margin-bottom:10px"><label>الاسم الظاهر في النظام</label><input type="text" id="acctName" value="'+escH(u.name||'')+'"></div>';
    h+='<div class="fg" style="margin-bottom:10px"><label>البريد الإلكتروني</label><input type="email" value="'+escH(u.email||'')+'" disabled></div>';
    h+='<button class="bt bt-p" onclick="saveMyName()">💾 حفظ الاسم</button>';
    h+='<div id="acctNameMsg" style="margin-top:8px;font-size:11px"></div></div>';

    h+='<div class="set-sec"><div class="set-sec-title">🔒 تغيير كلمة المرور</div>';
    h+='<div class="fr fr2" style="margin-top:8px">'+
       '<div class="fg"><label>كلمة المرور الحالية</label><input type="password" id="acctOldPass"></div>'+
       '<div class="fg"><label>كلمة المرور الجديدة</label><input type="password" id="acctNewPass" placeholder="6 أحرف على الأقل"></div>'+
       '</div>';
    h+='<button class="bt bt-p" onclick="saveMyPassword()">🔒 تحديث كلمة المرور</button>';
    h+='<div id="acctPassMsg" style="margin-top:8px;font-size:11px"></div></div>';

    h+='</div>';
    return h;
}
function saveMyName(){
    var inp=document.getElementById('acctName');
    var msg=document.getElementById('acctNameMsg');
    if(!inp||!msg)return;
    var name=(inp.value||'').trim();
    if(!name){ msg.style.color='var(--no)'; msg.textContent='من فضلك اكتب اسماً صحيحاً.'; return; }
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ الحفظ...';
    db.collection('users').doc(TG_USER.uid).update({name:name}).then(function(){
        TG_USER.name=name;
        msg.style.color='var(--ok)'; msg.textContent='✅ تم حفظ الاسم بنجاح.';
        var whoEl=document.getElementById('empWhoName'); if(whoEl) whoEl.textContent=name;
        var sbEl=document.getElementById('sbUser');
        if(sbEl) sbEl.innerHTML='👤 <strong style="color:#fff">'+escH(name)+'</strong><br>'+escH(TG_USER.email||'');
        // إشعار الأدمن
        tgNotifyAdmins('🧑 تحديث بيانات موظف', 'قام الموظف ' + name + ' بتحديث اسمه في النظام', 'name-change');
    }).catch(function(err){ msg.style.color='var(--no)'; msg.textContent='❌ '+err.message; });
}
function saveMyPassword(){
    var oldPass=(document.getElementById('acctOldPass').value||'');
    var newPass=(document.getElementById('acctNewPass').value||'');
    var msg=document.getElementById('acctPassMsg');
    if(!oldPass||!newPass){ msg.style.color='var(--no)'; msg.textContent='من فضلك املأ كلمة المرور الحالية والجديدة.'; return; }
    if(newPass.length<6){ msg.style.color='var(--no)'; msg.textContent='كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف.'; return; }
    msg.style.color='var(--tx3)'; msg.textContent='⏳ جارٍ التحديث...';
    var user=auth.currentUser;
    var cred=firebase.auth.EmailAuthProvider.credential(user.email,oldPass);
    user.reauthenticateWithCredential(cred).then(function(){
        return user.updatePassword(newPass);
    }).then(function(){
        msg.style.color='var(--ok)'; msg.textContent='✅ تم تحديث كلمة المرور بنجاح.';
        document.getElementById('acctOldPass').value='';
        document.getElementById('acctNewPass').value='';
    }).catch(function(err){
        var map={'auth/wrong-password':'كلمة المرور الحالية غير صحيحة.','auth/weak-password':'كلمة المرور الجديدة ضعيفة جداً.','auth/requires-recent-login':'يرجى تسجيل الخروج والدخول مرة أخرى ثم إعادة المحاولة.'};
        msg.style.color='var(--no)'; msg.textContent='❌ '+(map[err.code]||err.message);
    });
}

function logTbl(title,app,ref,cols,rows,docId){
    var h=H(title+' — ملحق '+app,ref,'',docId);
    h+=SC('١','بيانات الموظف');
    h+=F2(FG('السنة'),FG('القسم'))+F2(FG('الرقم الوظيفي'),FGE('اسم الموظف'));
    h+=SC('٢','السجل التفصيلي');
    h+='<table class="dt"><tr><th>م</th>';
    for(var i=0;i<cols.length;i++)h+='<th>'+cols[i]+'</th>';
    h+='</tr>';
    for(var r=1;r<=rows;r++){h+='<tr><td>'+r+'</td>';for(var j=0;j<cols.length;j++)h+='<td><input type="text"></td>';h+='</tr>'}
    h+='</table>';
    h+=SG3('توقيع الموظف','','المدير الإداري / مدير المشروعات','','المدير التنفيذي','',null,'admin','exec');
    h+=FT();
    return h;
}

// ─── MONTHLY EXPENSE SHEET (mexp) ──────────────────────────────────────────
function fmtMoney(n){
    n = isNaN(n) ? 0 : n;
    var parts = n.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.') + ' ج.م';
}
function mexpKey(){
    var mi = document.getElementById('mexp-month');
    return 'tg_mexp_' + (mi && mi.value ? mi.value : '');
}
function mexpInit(){
    var mi = document.getElementById('mexp-month');
    if(mi && !mi.value){
        var d = new Date();
        mi.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }
    mexpLoad();
}
function mexpLoad(){
    var tbody = document.getElementById('mexp-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    var raw = localStorage.getItem(mexpKey());
    var rows = [];
    try{ rows = raw ? JSON.parse(raw) : []; }catch(e){ rows = []; }
    if(rows.length === 0){
        for(var i = 0; i < 40; i++) mexpAddRow();
    } else {
        rows.forEach(function(r){ mexpAddRow(r); });
        while(tbody.children.length < 40){
            mexpAddRow();
        }
    }
    mexpCalc();
}
function mexpAddRow(row){
    var tbody = document.getElementById('mexp-tbody');
    if(!tbody) return;
    var tr = document.createElement('tr');
    var amtVal = (row && row.amt !== undefined && row.amt !== null && row.amt !== '') ? String(row.amt) : '';
    tr.innerHTML =
        '<td class="mexp-idx">' + (tbody.children.length + 1) + '</td>' +
        '<td><input type="text" class="mexp-spender" value="' + escH(row && row.spender || '') + '"></td>' +
        '<td><input type="text" class="mexp-cat" value="' + escH(row && row.cat || '') + '"></td>' +
        '<td><input type="number" step="0.01" class="mexp-amt" value="' + escH(amtVal) + '" oninput="mexpCalc()"></td>' +
        '<td><input type="date" class="mexp-date" value="' + escH(row && row.date || '') + '"></td>' +
        '<td><input type="text" class="mexp-notes" value="' + escH(row && row.notes || '') + '"></td>' +
        '<td class="np" style="text-align:center"><button class="bt bt-d" style="padding:3px 8px;font-size:10px" onclick="mexpDelRow(this)">✕</button></td>';
    tbody.appendChild(tr);
}
function mexpDelRow(btn){
    var tr = btn.closest('tr');
    if(tr) tr.remove();
    mexpReindex();
    mexpCalc();
}
function mexpReindex(){
    document.querySelectorAll('#mexp-tbody tr').forEach(function(tr, i){
        var idxEl = tr.querySelector('.mexp-idx');
        if(idxEl) idxEl.innerText = i + 1;
    });
}
function mexpCalc(){
    var total = 0, count = 0;
    document.querySelectorAll('#mexp-tbody .mexp-amt').forEach(function(inp){
        var v = parseFloat(inp.value);
        if(!isNaN(v) && v !== 0){ total += v; count++; }
    });
    var tf = document.getElementById('mexp-total'); if(tf) tf.value = fmtMoney(total);
    var cf = document.getElementById('mexp-count'); if(cf) cf.value = count;
    var tc = document.getElementById('mexp-total-cell'); if(tc) tc.innerText = fmtMoney(total);
}
function mexpSave(){
    var rows = [];
    document.querySelectorAll('#mexp-tbody tr').forEach(function(tr){
        var spender = tr.querySelector('.mexp-spender').value;
        var cat = tr.querySelector('.mexp-cat').value;
        var amt = tr.querySelector('.mexp-amt').value;
        var date = tr.querySelector('.mexp-date').value;
        var notes = tr.querySelector('.mexp-notes').value;
        if(spender || cat || amt || date || notes){
            rows.push({spender: spender, cat: cat, amt: amt, date: date, notes: notes});
        }
    });
    localStorage.setItem(mexpKey(), JSON.stringify(rows));
    var mi = document.getElementById('mexp-month');
    alert('✅ تم حفظ شيت المصروفات لشهر ' + (mi ? mi.value : ''));
}
window.mexpPrint = function() {
    if(typeof togglePrintKeepData === 'function') togglePrintKeepData(true);
    if(typeof openPrintPreview === 'function') {
        openPrintPreview();
    } else {
        window.print();
    }
};

// ─── MAIN LOAD ────────────────────────────────────────────────────────────
function load(id,c){
    var h="";

    // ── خطاب إداري عام (تصميم رسمي FL — نفس تنسيق كل المستندات) ──────────
    if(id==="gen"){
        h=H('خطاب إداري عام','نظام الإدارة الشامل · وثيقة رسمية','General Memorandum','gen');
        h+='<div class="FL-line"><span class="FL-line-lbl">إلى:</span><input type="text" class="FL-line-val" placeholder="الجهة / الشخص المرسل إليه"></div>';
        h+='<div class="FL-line"><span class="FL-line-lbl">من:</span><input type="text" class="FL-line-val" placeholder="الجهة المُصدرة"></div>';
        h+='<div class="FL-line"><span class="FL-line-lbl">الموضوع:</span><input type="text" class="FL-line-val FL-subject" placeholder="اكتب موضوع الخطاب هنا..."></div>';
        h+='<div class="FL-types">'+
           '<label><input type="radio" name="gtype" class="tpl-default-radio" checked> تعميم عام</label>'+
           '<label><input type="radio" name="gtype"> إشعار رسمي</label>'+
           '<label><input type="radio" name="gtype"> طلب إداري</label>'+
           '<label><input type="radio" name="gtype"> توجيه عمل</label>'+
           '<label><input type="radio" name="gtype"> دعوة لاجتماع</label>'+
           '<label><input type="radio" name="gtype"> أخرى</label>'+
           '</div>';
        h+='<input type="text" class="FL-open tpl-default" value="تحية طيبة وبعد،">';
        h+='<textarea class="FL-textbody" rows="9" placeholder="يرجى كتابة محتوى الخطاب بالتفصيل هنا..."></textarea>';
        h+='<input type="text" class="FL-close tpl-default" value="وتفضلوا بقبول فائق الاحترام والتقدير.">';
        h+='<div class="FL-extra">'+
           '<div class="FL-line"><span class="FL-line-lbl">مرفقات:</span><input type="text" class="FL-line-val"></div>'+
           '<div class="FL-line"><span class="FL-line-lbl">نسخة إلى:</span><input type="text" class="FL-line-val"></div>'+
           '</div>';
        h+='<div class="FL-types" style="margin-top:0">'+
           '<label><input type="radio" name="gsign" value="admin" class="tpl-default-radio" checked onclick="updGenSig(this)"> يُعتمد من المدير الإداري</label>'+
           '<label><input type="radio" name="gsign" value="tech" onclick="updGenSig(this)"> يُعتمد من المدير التقني</label>'+
           '<label><input type="radio" name="gsign" value="exec" onclick="updGenSig(this)"> يُعتمد من المدير التنفيذي</label>'+
           '</div>';
        h+='<div class="FL-signrow">'+
           _sigFL('محرر الخطاب','','إعداد ومراجعة')+
           _sigFL('المدير الإداري / مدير المشروعات',MGRS.admin,'اعتماد وإصدار','gen-issuer-sig')+
           _sigFL('المستلم','','بالعلم والاستلام')+
           '</div>';
        h+=FT(['نسخة للمُصدر','نسخة للمستلم','نسخة للأرشيف']);
    }

    // ── نموذج لفت نظر ──────────────────────────────────────────────────
    else if(id==="devres"){
        loadDevResAdmin(c);
        return;
    }
    else if(id==="aiadvisor"){
        loadAiAdvisor(c);
        return;
    }
    else if(id==="monthlyreports" || id==="weeklyreports" || id==="wkr"){
        loadWeeklyReportsAdmin(c);
        return;
    }
    else if(id==="monthlyplans"){
        loadMonthlyPlansAdmin(c);
        return;
    }
    else if(id==="notice"){
        h=H('نموذج لفت نظر','إنذار رسمي وفق اللائحة التنظيمية','OFFICIAL NOTICE','notice');
        h+=SC('١','بيانات الموظف');
        h+=F2(FGE('اسم الموظف'),FG('القسم / الإدارة'));
        h+=F2(FG('الكود الوظيفي'),FG('تاريخ التعيين','date'));
        h+=F2(FG('المسمى الوظيفي'),FG('المدير المباشر'));
        h+=SC('٢','تفاصيل المخالفة');
        h+=F2(FG('تاريخ المخالفة','date'),FG('المادة المخالفة'));
        h+='<div class="chk-grid"><label><input type="checkbox"> الانصراف المبكر</label><label><input type="checkbox"> الغياب بدون إذن</label><label><input type="checkbox"> التأخر في الحضور</label><label><input type="checkbox"> مخالفة اللوائح</label><label><input type="checkbox"> عدم الرد على المديرين</label><label><input type="checkbox"> إهمال في العمل</label></div>';
        h+='<div class="fg"><label>أخرى</label><input type="text"></div>';
        h+=FGA('وصف المخالفة بالتفصيل',4);
        h+=SC('٣','الإجراء المتخذ والتحذير الرسمي');
        h+='<div class="wb wb-gd"><strong>⚠ تنبيه رسمي</strong><br>يُعدّ هذا الإنذار وثيقة رسمية محفوظة في ملف الموظف، وفق أحكام قانون العمل المصري رقم 12 لسنة 2003. يُلزَم الموظف بالالتزام الفوري بأحكام المادة (1) من اللائحة التنظيمية.</div>';
        h+='<div class="wb wb-gd"><span class="wb-t">سياسة الخصم التراكمي</span> <span class="wb-t2">تطبيق تلقائي</span><br>في حال بلوغ عدد نماذج لفت النظر ٤ نماذج أو أكثر خلال الشهر التقويمي الواحد، يُطبَّق خصم من الراتب تلقائياً بقرار من المدير التنفيذي.</div>';
        h+=SC('٤','التوقيعات');
        h+=SG3('توقيع الموظف','إقراراً باستلام هذا الإنذار',
               'المدير الإداري / مدير المشروعات','اعتماد وإشهاد',
               'المدير التنفيذي','موافقة وإصدار',
               null,'admin','exec');
        h+=FT();
    }

    // ── نموذج إدارة المشروع ─────────────────────────────────────────────
    else if(id==="proj"){
        h=H('نموذج إدارة المشروع','متابعة وتوثيق المشاريع — للاستخدام الداخلي','PROJECT MANAGEMENT','proj');
        h+=SC('١','بيانات المشروع الأساسية');
        h+=F3(FG('اسم المشروع'),FG('التاريخ','date'),FG('المسؤول التقني عن المشروع'));
        h+='<div class="fg fg-full"><label>الحالة</label><div class="chk-grid" style="grid-template-columns:repeat(5,1fr)"><label><input type="checkbox"> مكتمل</label><label><input type="checkbox"> قيد التنفيذ</label><label><input type="checkbox"> في الانتظار</label><label><input type="checkbox"> متأخر</label><label><input type="checkbox"> مراجعة</label></div></div>';
        h+=SC('٢','معلومات المشروع');
        h+=F2(FG('نوع المشروع'),FG('العميل / الجهة'));
        h+=F2(FG('الموعد النهائي','date'),FG('تاريخ البداية','date'));
        h+=F2(FG('القسم المسؤول'),FG('الميزانية'));
        h+=F2(FG('رقم التواصل','tel'),FG('عدد الأعضاء','number'));
        h+=SC('٣','تفاصيل المشروع');
        h+=FGA('وصف المشروع',4);
        h+='<div class="fg fg-full"><label>الأولوية</label><div class="chk-grid" style="grid-template-columns:repeat(3,1fr)"><label><input type="radio" name="prp"> عالية</label><label><input type="radio" name="prp"> متوسطة</label><label><input type="radio" name="prp"> عادية</label></div></div>';
        h+='<div class="fg"><label>نسبة الإنجاز</label><input type="text" placeholder="%"></div>';
        h+=SC('٤','فريق العمل والمهام');
        h+='<table class="dt"><tr><th>م</th><th>الاسم والوظيفة</th><th>التاسك</th><th>الموعد</th><th>الأولوية</th><th>الحالة</th><th>ملاحظة</th></tr>';
        for(var pr=1;pr<=12;pr++) h+='<tr><td>'+pr+'</td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>';
        h+='</table>';
        h+=SC('٥','ملاحظات عامة على المشروع');
        h+=FGA('',4);
        h+=SC('٦','التوقيعات');
        h+=SG3('مدير المشروعات','','المدير التقني','','المدير التنفيذي','اعتماد',null,null,'exec');
        h+=FT();
    }



    // ── ملف بيانات الموظف ──────────────────────────────────────────────
    else if(id==="emp"){
        h=H('ملف بيانات الموظف الكامل','يرجى التعبئة بخط واضح · للاستخدام الداخلي فقط','EMPLOYEE FILE','emp');
        h+=SC('١','البيانات الشخصية');
        h+=F2(FG('الاسم الكامل'),FG('الرقم القومي'));
        h+=F3(FG('تاريخ الميلاد','date'),FG('الجنسية'),FGS('الحالة الاجتماعية',['أعزب','متزوج','مطلق','أرمل']));
        h+=F2(FG('رقم الهاتف','tel'),FG('البريد الإلكتروني','email'));
        h+='<div class="fg"><label>العنوان</label><input type="text"></div>';
        h+=SC('٢','بيانات الوظيفة');
        h+=F2(FG('المسمى الوظيفي'),FG('القسم / الإدارة'));
        h+=F3(FG('تاريخ التعيين','date'),FG('الرقم الوظيفي'),FGS('نوع العقد',['دوام كامل','دوام جزئي','عقد مؤقت']));
        h+=F2(FG('المدير المباشر'),FG('درجة الوظيفة'));
        h+=SC('٣','ساعات العمل والحضور — المادة ١');
        h+='<table class="dt"><tr><th>أيام العمل</th><td>الأحد — الخميس</td><th>الحد الأقصى اليومي</th><td>٨ ساعات (م. ١١٧)</td></tr><tr><th>وقت الحضور</th><td>١٠:٠٠ صباحاً</td><th>فترة السماح</th><td>حتى ١٠:٣٠ صباحاً</td></tr><tr><th>وقت الانصراف</th><td>٦:٠٠ مساءً</td><th>نظام العمل</th><td>حضوري — هجين عند الحاجة</td></tr><tr><th>تسجيل الحضور</th><td>بجهاز البصمة إلزامياً</td><th>إخطار الاستقالة</th><td>شهر على الأقل مسبقاً</td></tr></table>';
        h+=SC('٤','العمل الإضافي — المادة ٢');
        h+='<table class="dt"><tr><th>الحد الأقصى اليومي</th><td>١٠ ساعات (م. ١١٩)</td><th>عمل يوم الراحة</th><td>مثلي الأجر أو يوم بديل</td></tr><tr><th>بدل إضافي نهاري</th><td>لا يقل عن ٣٥٪ من الأجر</td><th>بدل إضافي ليلي</th><td>لا يقل عن ٧٠٪ من الأجر</td></tr></table>';
        h+=SC('٥','الإجازات — المادة ٣');
        h+='<table class="dt"><tr><th>نوع الإجازة</th><th>الاستحقاق</th><th>ملاحظات</th></tr><tr><td>سنوية — السنة الأولى</td><td>١٥ يوماً</td><td>السنة الأولى: ٦ أيام متصلة على الأقل</td></tr><tr><td>سنوية — السنة الثانية +</td><td>٢١ يوماً</td><td>الحد الأقصى للإجازة السنوية</td></tr><tr><td>عارضة (م. ١٢٨)</td><td>٧ أيام/سنة — حد أقصى يومان/مرة</td><td>تحتسب من الإجازة السنوية</td></tr><tr><td>أعياد ومناسبات (م. ١٢٩)</td><td>بأجر كامل</td><td>بقرار من الوزير المختص</td></tr></table>';
        h+='<div style="font-size:9px;color:var(--tx3);margin-top:4px">⊳ التفاصيل الكاملة وسجلات الإجازة في الملاحق (أ، ب، ج) المرفقة</div>';
        h+='<div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 20px;">';
        h+=SC('٦','الإقرار والتوقيع');
        h+='<div class="wb wb-gd">أقر بأنني اطلعت على اللائحة التنظيمية لشركة تيك جو وأتعهد بالالتزام الكامل بجميع بنودها.</div>';
        h+='</div>';

        // ملحق أ
        h+='<div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 20px;">';
        h+='<div class="sec" style="margin-top:0"><div class="num">أ</div><div class="stx">ملحق (أ) — سجل الإجازة السنوية</div></div>';
        h+='<div style="font-size:9px;color:var(--tx3);margin-bottom:6px">استناداً للمادتين ١٢٤ و١٢٥ من اللائحة التنظيمية</div>';
        h+=F2(FG('السنة'),FGE('اسم الموظف'));
        h+=F3(FG('إجمالي الاستحقاق (يوم)'),FG('الأيام المستخدمة'),FG('الرصيد المتبقي'));
        h+='<div class="wb wb-bl" style="font-size:9px">⊳ الاستحقاق: ١٥ يوماً في السنة الأولى · ٢١ يوماً كحد أقصى (م. ١٢٤)</div>';
        h+='<table class="dt"><tr><th>م</th><th>تاريخ البدء</th><th>تاريخ الانتهاء</th><th>الأيام المستخدمة</th><th>الموافقة</th><th>ملاحظات</th></tr>';
        for(var aa=1;aa<=21;aa++) h+='<tr><td>'+aa+'</td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>';
        h+='</table>';
        h+='<div class="wb wb-bl" style="font-size:8px">⊳ م. ١٢٤: يستحق الموظف إجازة سنوية بأجر لا تحتسب فيها أيام العطلات والأعياد وأيام الراحة الأسبوعية.<br>⊳ م. ١٢٥: يحدد صاحب العمل مواعيد الإجازة وفق مقتضيات العمل، ولا يجوز قطعها إلا لأسباب قوية.<br>⊳ م. ١٢٧: يحق لصاحب العمل استرداد أجر الإجازة إذا ثبت اشتغال الموظف لدى جهة أخرى خلالها.<br>⊳ عند انتهاء العلاقة الوظيفية يستحق الموظف أجر رصيد الإجازات غير المستخدمة كاملاً.</div>';
        h+='</div>';

        // ملحق ب
        h+='<div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 20px;">';
        h+='<div class="sec" style="margin-top:0"><div class="num">ب</div><div class="stx">ملحق (ب) — سجل الإجازة العارضة</div></div>';
        h+='<div style="font-size:9px;color:var(--tx3);margin-bottom:6px">استناداً للمادة ١٢٨ من اللائحة التنظيمية</div>';
        h+=F2(FG('السنة'),FGE('اسم الموظف'));
        h+=F3(FG('الحد الأقصى السنوي'),FG('إجمالي الأيام المستخدمة'),FG('الرصيد المتبقي من ٧'));
        h+='<div class="wb wb-gd" style="font-size:9px">⊳ الإجازة العارضة تخصم تلقائياً من رصيد الإجازة السنوية (م. ١٢٨)<br>⊳ الحد الأقصى في المرة الواحدة: يومان فقط — أي طلب يتجاوز اليومين يحول تلقائياً إلى إجازة سنوية</div>';
        h+='<table class="dt"><tr><th>م</th><th>السبب</th><th>تاريخ البدء</th><th>تاريخ الانتهاء</th><th>عدد الأيام</th><th>الموافقة</th><th>ملاحظات</th></tr>';
        for(var bb=1;bb<=7;bb++) h+='<tr><td>'+bb+'</td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>';
        h+='</table>';
        h+='</div>';

        // ملحق ج
        h+='<div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 20px;">';
        h+='<div class="sec" style="margin-top:0"><div class="num">ج</div><div class="stx">ملحق (ج) — سجل إجازات الأعياد والمناسبات</div></div>';
        h+='<div style="font-size:9px;color:var(--tx3);margin-bottom:6px">استناداً للمادة ١٢٩ من اللائحة التنظيمية</div>';
        h+=F2(FG('السنة'),FGE('اسم الموظف'));
        h+=F3(FG('إجمالي أيام الأعياد'),FG('أيام عمل في عطلة (مثلي الأجر)'),FG('أيام راحة بديلة مستحقة'));
        h+='<div class="wb wb-gd" style="font-size:9px">⊳ التشغيل في أيام الأعياد يستوجب مثلي الأجر أو يوم راحة بديل — م. ١٢٩</div>';
        h+='<table class="dt"><tr><th>م</th><th>التاريخ</th><th>المناسبة</th><th>هل عمل؟</th><th>البديل</th><th>الموافقة</th><th>ملاحظات</th></tr>';
        for(var cc=1;cc<=25;cc++) h+='<tr><td>'+cc+'</td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>';
        h+='</table>';
        h+='</div>';

        // ملحق د
        h+='<div style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 20px;">';
        h+='<div class="sec" style="margin-top:0"><div class="num">د</div><div class="stx">ملحق (د) — سجل الغياب بالخصم</div></div>';
        h+='<div style="font-size:9px;color:var(--tx3);margin-bottom:6px">استناداً للمادة ١٣٠ من اللائحة التنظيمية</div>';
        h+=F2(FG('السنة'),FGE('اسم الموظف'));
        h+='<div class="wb wb-gd" style="font-size:9px">⊳ يسجل الغياب بغير عذر مقبول ويخصم من أجر الموظف بواقع أجر اليوم الواحد (م. ١٣٠)<br>⊳ الحد الأقصى للخصم الشهري لا يتجاوز أجر ستة أيام — الزيادة تحال لمسار الجزاءات التأديبية</div>';
        h+='<table class="dt"><tr><th>م</th><th>التاريخ</th><th>سبب الغياب</th><th>أيام الغياب</th><th>نسبة الخصم %</th><th>مبلغ الخصم (جنيه)</th><th>الموافقة</th><th>ملاحظات</th></tr>';
        for(var dd=1;dd<=13;dd++) h+='<tr><td>'+dd+'</td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>';
        h+='</table>';
        h+='<div class="wb wb-bl" style="font-size:8px">⊳ م. ١٣٠: يخصم من أجر الموظف عن كل يوم غياب بدون عذر بواقع أجر يوم واحد كامل.<br>⊳ م. ١٣١: يوثق قرار الخصم بموافقة خطية من المدير المباشر ويحفظ في ملف الموظف.<br>⊳ لا يحتسب الغياب بعذر مقبول (مرض بتقرير طبي أو إجازة معتمدة) ضمن هذا السجل.</div>';
        h+='</div>';

        // ملاحظات 1
        h+='<div style="page-break-before: always; break-before: page; page-break-inside: avoid; break-inside: avoid; margin-bottom: 20px;">';
        h+='<div class="sec" style="margin-top:0"><div class="num">✎</div><div class="stx">ملاحظات (١)</div></div>';
        h+='<div class="fg fg-full"><label>صفحة الملاحظات ١</label><textarea rows="28" style="line-height:2.1;border:1px solid var(--bd)"></textarea></div>';
        h+='</div>';

        // ملاحظات 2
        h+='<div style="page-break-before: always; break-before: page; page-break-inside: avoid; break-inside: avoid; margin-bottom: 20px;">';
        h+='<div class="sec" style="margin-top:0"><div class="num">✎</div><div class="stx">ملاحظات (٢)</div></div>';
        h+='<div class="fg fg-full"><label>صفحة الملاحظات ٢</label><textarea rows="20" style="line-height:2.1;border:1px solid var(--bd)"></textarea></div>';
        h+=SG3('توقيع الموظف','','المدير الإداري / مدير المشروعات','','المدير التنفيذي','',null,'admin','exec');
        h+='</div>';
        h+=FT();
    }

    // ── طلب إجازة ──────────────────────────────────────────────────────
    else if(id==="leave"){
        h=H('نموذج طلب إجازة','اللائحة التنظيمية — المادة الثالثة','LEAVE REQUEST','leave');
        h+=SC('١','بيانات الموظف');
        h+=F2(FG('الاسم بالكامل'),FG('القسم / الإدارة'));
        h+=F2(FG('المسمى الوظيفي'),FG('رقم التواصل أثناء الإجازة','tel'));
        h+=SC('٢','نوع الإجازة');
        h+='<div class="chk-grid" style="grid-template-columns:1fr 1fr"><label><input type="radio" name="lt"> <strong>إجازة سنوية</strong> (م.١٢٤)</label><label><input type="radio" name="lt"> <strong>إجازة عارضة</strong> (م.١٢٨)</label></div>';
        h+=SC('٣','مدة الإجازة');
        h+=F3(FG('تاريخ البدء','date'),FG('تاريخ الانتهاء','date'),FG('عدد الأيام','number'));
        h+=SC('٤','سبب الإجازة والرصيد');
        h+='<div class="fg"><label>سبب الإجازة</label><input type="text"></div>';
        h+=F3(FG('الرصيد المتاح'),FG('الرصيد المتبقي'),FG('البديل أثناء الغياب'));
        h+='<div class="wb wb-gd"><strong>⚠ م.١٢٧:</strong> العمل لدى جهة أخرى أثناء الإجازة يُعرّض الموظف للحرمان من الأجر أو الجزاء التأديبي.</div>';
        h+=SC('٥','حالة الطلب');
        h+='<div class="stg"><button class="stb ok" onclick="ts(this)">✅ موافق</button><button class="stb no" onclick="ts(this)">❌ مرفوض</button><button class="stb pn a" onclick="ts(this)">⏳ معلق</button></div>';
        h+=SC('٦','التوقيعات');
        h+=SG3('توقيع الموظف','','المدير الإداري / مدير المشروعات','الموافقة','المدير التنفيذي','الاعتماد النهائي',null,'admin','exec');
        h+=FT();
    }

    // ── إذن حضور / انصراف ─────────────────────────────────────────────
    else if(id==="perm"){
        h=H('إذن حضور / انصراف','اللائحة التنظيمية — المادة الثالثة','ATTENDANCE PERMISSION','perm');
        h+=SC('١','نوع الإذن');
        h+='<div class="chk-grid" style="grid-template-columns:1fr 1fr"><label><input type="radio" name="pt"> <strong>حضور</strong> بعد مواعيد العمل</label><label><input type="radio" name="pt"> <strong>انصراف</strong> قبل مواعيد العمل</label></div>';
        h+=SC('٢','بيانات الموظف');
        h+=F2(FGE('اسم الموظف'),FG('الرقم الوظيفي'));
        h+=F2(FG('القسم / الإدارة'),FG('التاريخ','date'));
        h+=SC('٣','تفاصيل الإذن');
        h+=F3(FG('الموعد الرسمي','time'),FG('الحضور/الانصراف الفعلي','time'),FG('مدة الفارق'));
        h+=FGA('السبب',2);
        h+=SC('٤','التوقيعات');
        h+=SG3('توقيع الموظف','','المدير الإداري','الموافقة','المدير التنفيذي','',null,'admin','exec');
        h+='<div style="text-align:center;font-size:8px;color:var(--tx3);margin-top:6px">المغادرة أو التأخر بدون إذن موقع يعد مخالفة تأديبية م. ١٢٤</div>';
        h+=FT();
    }

    // ── التماس تعديل موعد الحضور ──────────────────────────────────────
    else if(id==="delay"){
        h=H('التماس تعديل موعد الحضور','طلب تعديل موعد الحضور الرسمي بصفة دائمة','ATTENDANCE DELAY REQUEST','delay');

        // ١ — بيانات الموظف
        h+=SC('١','بيانات الموظف');
        h+=F2(FGE('اسم الموظف الكامل'),FG('الرقم الوظيفي'));
        h+=F2(FG('المسمى الوظيفي'),FG('القسم / الإدارة'));
        h+=F2(FG('رقم التواصل','tel'),FG('التاريخ','date'));

        // ٢ — تفاصيل الالتماس
        h+=SC('٢','تفاصيل الالتماس');
        h+=F3(
            FG('موعد الحضور الرسمي الحالي','time'),
            '<div class="fg"><label>مدة التأخير المطلوبة</label><select><option>ساعة واحدة كحد أقصى</option><option>ساعتان كحد أقصى</option></select></div>',
            FG('الموعد المقترح بعد التعديل','time')
        );
        h+=FGA('سبب طلب التعديل (يُرجى التفصيل)',4,
            'مثال: بُعد مسافة السكن عن مقر العمل وشُح وسائل المواصلات المتاحة في أوقات الصباح الباكر...');

        // ٣ — التزامات الموظف
        h+=SC('٣','التزامات الموظف');
        h+='<div class="wb wb-gd" style="font-size:11px;line-height:2">'
          +'<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin-bottom:6px">'
          +'<input type="checkbox" style="margin-top:4px;flex-shrink:0"> '
          +'<span>أتعهد بإتمام ساعات العمل الكاملة المقررة يومياً دون تقليص.</span>'
          +'</label>'
          +'<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;margin-bottom:6px">'
          +'<input type="checkbox" style="margin-top:4px;flex-shrink:0"> '
          +'<span>أتعهد بتعويض وقت التأخير بالانصراف في وقت متأخر مماثل بالضبط.</span>'
          +'</label>'
          +'<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer">'
          +'<input type="checkbox" style="margin-top:4px;flex-shrink:0"> '
          +'<span>أتعهد بإخطار المدير المباشر فوراً في حال أي تغيير على الظروف الموضحة أعلاه.</span>'
          +'</label>'
          +'</div>';

        // ٤ — إشعار مهم
        h+=SC('٤','إشعار هام');
        h+='<div class="wb wb-gd" style="font-size:10px;line-height:1.9;border-right:4px solid var(--no,#e53e3e)">'
          +'<strong>⚠ تنبيه:</strong> يُعدّ هذا الالتماس نافذاً فقط بعد الموافقة الخطية من المدير الإداري والمدير التنفيذي.<br>'
          +'في حال رفض الطلب، يلتزم الموظف بالحضور في الموعد الرسمي المحدد بالساعة العاشرة صباحاً وفق اللائحة التنظيمية.<br>'
          +'<strong>يُحفظ هذا الالتماس في الملف الشخصي للموظف ويُعدّ وثيقة رسمية.</strong>'
          +'</div>';

        // ٥ — حالة الطلب
        h+=SC('٥','قرار الإدارة');
        h+='<div class="stg"><button class="stb ok" onclick="ts(this)">✅ موافق</button>'
          +'<button class="stb no" onclick="ts(this)">❌ مرفوض</button>'
          +'<button class="stb pn a" onclick="ts(this)">⏳ قيد الدراسة</button></div>';
        h+='<div class="fg" style="margin-top:10px"><label>ملاحظات الإدارة</label><input type="text" placeholder="أي ملاحظات أو شروط مرفقة بالموافقة..."></div>';

        // ٦ — التوقيعات
        h+=SC('٦','التوقيعات');
        h+=SG3(
            'توقيع الموظف','مقدم الالتماس',
            'المدير الإداري / مدير المشروعات','اعتماد وتوثيق',
            'المدير التنفيذي','الموافقة النهائية',
            null,'admin','exec'
        );
        h+=FT();
    }

    // ── سجلات الإجازة ──────────────────────────────────────────────────
    else if(id==="la") h=logTbl('سجل الإجازة السنوية','أ','المادتين ١٢٤ و١٢٥',['تاريخ البدء','تاريخ الانتهاء','الأيام','الموافقة','ملاحظات'],21,'la');
    else if(id==="lb") h=logTbl('سجل الإجازة العارضة','ب','المادة ١٢٨',['السبب','تاريخ البدء','تاريخ الانتهاء','الأيام','الموافقة','ملاحظات'],7,'lb');
    else if(id==="lc") h=logTbl('سجل الأعياد والمناسبات','ج','المادة ١٢٩',['التاريخ','المناسبة','هل عمل؟','البديل','الموافقة','ملاحظات'],25,'lc');
    else if(id==="ld") h=logTbl('سجل الغياب بالخصم','د','المادة ١٣٠',['التاريخ','السبب','الأيام','الخصم %','المبلغ','الموافقة','ملاحظات'],13,'ld');

    // ── خطاب إنذار ────────────────────────────────────────────────────
    else if(id==="warn"){
        h=H('خطاب إنذار إداري','توجيه إنذار لعدم الالتزام باللوائح','WARNING LETTER','warn');
        h+=SC('١','بيانات الموظف');
        h+=F2(FGE('اسم الموظف'),FG('الرقم الوظيفي'));
        h+=F2(FG('المسمى الوظيفي'),FG('القسم / الإدارة'));
        h+=SC('٢','درجة الإنذار');
        h+='<div class="chk-grid" style="grid-template-columns:1fr 1fr 1fr"><label style="color:var(--wn)"><input type="radio" name="wl"> <strong>إنذار أول</strong></label><label style="color:#ed8936"><input type="radio" name="wl"> <strong>إنذار ثانٍ</strong></label><label style="color:var(--no)"><input type="radio" name="wl"> <strong>إنذار نهائي</strong></label></div>';
        h+=SC('٣','تفاصيل المخالفة');
        h+=FGA('أسباب توجيه الإنذار (المخالفات)',4);
        h+=FGA('الإجراءات التصحيحية المطلوبة',3);
        h+='<div class="wb wb-gd"><strong>⚠</strong> في حالة تكرار المخالفة يحق للشركة اتخاذ إجراءات تصعيدية قد تصل إلى الفصل.</div>';
        h+=SC('٤','التوقيعات');
        h+=SG3('توقيع الموظف','بالاستلام والعلم',
               'المدير الإداري / مدير المشروعات','اعتماد وإشهاد',
               'المدير التنفيذي','موافقة وإصدار',
               null,'admin','exec');
        h+=FT();
    }

    // ── محضر تحقيق ────────────────────────────────────────────────────
    else if(id==="inv"){
        h=H('محضر تحقيق داخلي','توثيق رسمي لجلسة تحقيق','INVESTIGATION REPORT','inv');
        h+=SC('١','بيانات الجلسة');
        h+=F3(FG('تاريخ التحقيق','date'),FG('وقت التحقيق','time'),FG('مكان التحقيق'));
        h+=SC('٢','أطراف التحقيق');
        h+=F2(FG('المحقق (الاسم والصفة)'),FG('المُحال للتحقيق'));
        h+=SC('٣','مجريات التحقيق');
        h+=FGA('ملخص المخالفة المنسوبة',3);
        h+=FGA('الأسئلة والأجوبة',8,'س: ...\nج: ...');
        h+=SC('٤','التوصيات والقرارات');
        h+=FGA('',3);
        h+=SC('٥','التوقيعات');
        h+=SG3('الموظف','أقر بصحة أقوالي',
               'المدير الإداري / المحقق','',
               'المدير التنفيذي','اعتماد وإصدار',
               null,'admin','exec');
        h+=FT();
    }

    // ── شهادة خبرة ────────────────────────────────────────────────────
    else if(id==="exp"){
        h=H('شهادة خبرة','إدارة الموارد البشرية','EXPERIENCE CERTIFICATE','exp',true);
        h+='<div class="cert"><h2 style="text-align:center;color:var(--nv);font-size:20px;font-weight:800;text-decoration:underline;margin-bottom:24px">شـهـادة خـبـرة</h2>';
        h+='<div style="text-align:left;margin-bottom:24px">التاريخ: <input type="date"></div>';
        h+='تشهد إدارة الموارد البشرية بشركة <strong><span class="dcn"></span></strong> بأن:<br><br>';
        h+='السيد/ة: <input type="text" style="width:280px;font-weight:bold"><br>';
        h+='والذي يحمل جنسية: <input type="text" style="width:150px"><br><br>';
        h+='قد عمل لدينا بوظيفة: <input type="text" style="width:230px;font-weight:bold"><br>';
        h+='خلال الفترة من <input type="date"> إلى <input type="date"><br><br>';
        h+='وقد أُعطيت له هذه الشهادة بناءً على طلبه دون أدنى مسؤولية على الشركة.';
        h+='<div style="margin-top:50px;display:flex;justify-content:space-between;align-items:flex-end;text-align:center">'+
           '<div><div style="font-weight:700;color:var(--nv);margin-bottom:24px">ختم الشركة</div>'+
           '<div style="width:100px;height:100px;border:2px dashed #cbd5e0;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#a0aec0;font-size:9px;transform:rotate(-15deg)">موقع الختم</div></div>'+
           '<div style="text-align:center"><div style="font-weight:700;color:var(--nv);margin-bottom:6px">المدير التنفيذي</div>'+
           '<div class="cert-mgr-nm">'+(MGRS.exec||'&nbsp;')+'</div>'+
           '<div style="border-bottom:1.5px solid #333;width:220px;margin:0 auto"></div></div>'+
           '</div>';
        h+=FT(['نسخة للموظف','نسخة للأرشيف']);
    }

    // ── إخلاء طرف ─────────────────────────────────────────────────────
    else if(id==="clr"){
        h=H('نموذج إخلاء طرف · براءة ذمة','يُعبأ عند انتهاء خدمات الموظف','CLEARANCE FORM','clr');
        h+=SC('١','بيانات الموظف');
        h+=F3(FG('الاسم'),FG('الرقم الوظيفي'),FG('القسم'));
        h+=F2(FG('آخر يوم عمل','date'),FGS('سبب إنهاء الخدمة',['استقالة','انتهاء عقد','إقالة']));
        h+=SC('٢','تواقيع الإدارات (إخلاء العُهد)');
        h+='<table class="dt" style="text-align:right"><tr><th style="width:22%">الإدارة</th><th style="width:40%">العهد المُستردة</th><th>التوقيع</th></tr>';
        h+='<tr><td style="font-weight:bold">المدير الإداري / مدير المشروعات</td><td><input type="text" style="text-align:right"></td><td><input type="text"></td></tr>';
        h+='<tr><td style="font-weight:bold">المدير التقني</td><td><input type="text" style="text-align:right"></td><td><input type="text"></td></tr>';
        h+='<tr><td style="font-weight:bold">تقنية المعلومات</td><td><input type="text" style="text-align:right"></td><td><input type="text"></td></tr>';
        h+='<tr><td style="font-weight:bold">الشؤون الإدارية</td><td><input type="text" style="text-align:right"></td><td><input type="text"></td></tr>';
        h+='<tr><td style="font-weight:bold">الإدارة المالية</td><td><input type="text" style="text-align:right"></td><td><input type="text"></td></tr></table>';
        h+=SC('٣','الإقرار');
        h+='<div class="wb wb-bl">أقر بأنني استلمت كافة مستحقاتي وسلمت جميع العُهد الموجودة بحوزتي.</div>';
        h+=SG3('توقيع الموظف','','المدير الإداري / مدير المشروعات','اعتماد الإخلاء','المدير التنفيذي','الموافقة النهائية',null,'admin','exec');
        h+=FT();
    }

    // ── طلب استقالة ───────────────────────────────────────────────────
    else if(id==="res"){
        h=H('نموذج طلب استقالة','وفق اللائحة التنظيمية — إشعار إنهاء الخدمة','RESIGNATION REQUEST','res');
        h+=SC('١','بيانات الموظف');
        h+=F2(FG('الاسم بالكامل'),FG('الرقم الوظيفي'));
        h+=F3(FG('القسم / الإدارة'),FG('المسمى الوظيفي'),FG('تاريخ التعيين','date'));
        h+=SC('٢','تفاصيل الاستقالة');
        h+=F3(FG('تاريخ تقديم الطلب','date'),FG('آخر يوم عمل مقترح','date'),FG('مدة الإشعار (بالأيام)'));
        h+='<div class="wb wb-bl"><strong>⊳ ملاحظة:</strong> يلتزم الموظف بإخطار الشركة برغبته في إنهاء الخدمة قبل شهر واحد على الأقل من تاريخ ترك العمل الفعلي.</div>';
        h+=FGA('سبب تقديم الاستقالة (اختياري)',3);
        h+=SC('٣','الإقرار');
        h+='<div class="wb wb-gd">أقر أنا الموقّع أدناه برغبتي في إنهاء خدمتي لدى شركة <span class="dcn"></span> اعتباراً من التاريخ المذكور أعلاه، وأتعهد بتسليم كافة العُهد والمستندات الخاصة بالعمل قبل تاريخ آخر يوم عمل.</div>';
        h+=SC('٤','حالة الطلب');
        h+='<div class="stg"><button class="stb ok" onclick="ts(this)">✅ مقبولة</button><button class="stb no" onclick="ts(this)">❌ مرفوضة</button><button class="stb pn a" onclick="ts(this)">⏳ قيد المراجعة</button></div>';
        h+=SC('٥','التوقيعات');
        h+=SG3('توقيع الموظف','مقدم الطلب',
               'المدير الإداري / مدير المشروعات','استلام ومراجعة',
               'المدير التنفيذي','الموافقة النهائية',
               null,'admin','exec');
        h+='<div style="text-align:center;font-size:8px;color:var(--tx3);margin-top:6px">⊳ يُستكمل إجراء إخلاء الطرف عبر نموذج «إخلاء طرف» بعد اعتماد الاستقالة</div>';
        h+=FT();
    }

    // ── قرار ترقية ────────────────────────────────────────────────────
    else if(id==="promo"){
        h=H('قرار ترقية','تعديل المسمى الوظيفي والدرجة','PROMOTION DECISION','promo');
        h+=SC('١','بيانات الموظف الحالية');
        h+=F2(FG('الاسم بالكامل'),FG('الرقم الوظيفي'));
        h+=F3(FG('القسم / الإدارة'),FG('المسمى الوظيفي الحالي'),FG('تاريخ التعيين','date'));
        h+=SC('٢','تفاصيل الترقية');
        h+=F2(FG('المسمى الوظيفي الجديد'),FG('القسم / الإدارة الجديدة (إن وُجد)'));
        h+=F3(FG('تاريخ سريان الترقية','date'),FG('الراتب الحالي'),FG('الراتب الجديد'));
        h+='<div class="fg"><label>نسبة الزيادة</label><input type="text" placeholder="%"></div>';
        h+=SC('٣','أساس الترقية');
        h+='<div class="chk-grid" style="grid-template-columns:1fr 1fr"><label><input type="checkbox"> تقييم أداء متميز</label><label><input type="checkbox"> الأقدمية الوظيفية</label><label><input type="checkbox"> استحداث منصب جديد</label><label><input type="checkbox"> إعادة هيكلة الإدارة</label></div>';
        h+=FGA('ملاحظات إضافية',3);
        h+=SC('٤','التوقيعات');
        h+=SG3('المدير المباشر','توصية بالترقية',
               'المدير الإداري / مدير المشروعات','مراجعة واعتماد',
               'المدير التنفيذي','الاعتماد النهائي',
               null,'admin','exec');
        h+=FT();
    }

    // ── قرار زيادة راتب / علاوة ───────────────────────────────────────
    else if(id==="raise"){
        h=H('قرار زيادة راتب / علاوة','تعديل الأجر الشهري','SALARY INCREASE DECISION','raise');
        h+=SC('١','بيانات الموظف');
        h+=F2(FG('الاسم بالكامل'),FG('الرقم الوظيفي'));
        h+=F2(FG('القسم / الإدارة'),FG('المسمى الوظيفي'));
        h+=SC('٢','نوع الزيادة');
        h+='<div class="chk-grid" style="grid-template-columns:1fr 1fr 1fr"><label><input type="radio" name="rtp"> علاوة دورية</label><label><input type="radio" name="rtp"> علاوة استثنائية</label><label><input type="radio" name="rtp"> زيادة تقديرية</label></div>';
        h+=SC('٣','تفاصيل الزيادة');
        h+=F3(FG('الراتب الحالي'),FG('قيمة الزيادة'),FG('الراتب الجديد'));
        h+=F2(FG('نسبة الزيادة','text'),FG('تاريخ السريان','date'));
        h+=FGA('سبب الزيادة',3);
        h+=SC('٤','التوقيعات');
        h+=SG3('المدير المباشر','توصية',
               'المدير الإداري / مدير المشروعات','مراجعة',
               'المدير التنفيذي','الاعتماد النهائي',
               null,'admin','exec');
        h+=FT();
    }

    // ── عقد عمل ───────────────────────────────────────────────────────
    else if(id==="contract"){
        h=H('عقد عمل','اتفاقية توظيف بين الطرفين','EMPLOYMENT CONTRACT','contract',true);
        h+=SC('١','أطراف العقد');
        h+='<table class="dt"><tr><th style="width:22%">الطرف الأول</th><td>شركة <span class="dcn"></span> ويمثلها في توقيع هذا العقد <input type="text" style="width:180px"></td></tr>'+
           '<tr><th>الطرف الثاني</th><td>السيد/ة <input type="text" style="width:220px;font-weight:bold"></td></tr></table>';
        h+=SC('٢','بيانات الطرف الثاني');
        h+=F2(FG('الرقم القومي'),FG('تاريخ الميلاد','date'));
        h+='<div class="fg"><label>العنوان</label><input type="text"></div>';
        h+=F2(FG('رقم الهاتف','tel'),FG('البريد الإلكتروني','email'));
        h+=SC('٣','بيانات الوظيفة');
        h+=F3(FG('المسمى الوظيفي'),FG('القسم / الإدارة'),FG('تاريخ بدء العمل','date'));
        h+=F2(FGS('نوع العقد',['محدد المدة','غير محدد المدة']),FG('مدة فترة التجربة (بالأشهر)'));
        h+=SC('٤','الأجر والمزايا');
        h+=F3(FG('الراتب الأساسي (جنيه)'),FG('بدلات (إن وُجدت)'),FG('إجمالي الأجر الشهري'));
        h+='<div class="fg"><label>مواعيد صرف الراتب</label><input type="text" class="tpl-default" value="نهاية كل شهر ميلادي عن طريق التحويل البنكي"></div>';
        h+=SC('٥','ساعات العمل وأيام الراحة');
        h+='<table class="dt"><tr><th>أيام العمل</th><td>الأحد — الخميس</td><th>الحد الأقصى اليومي</th><td>٨ ساعات (م. ١١٧)</td></tr><tr><th>وقت الحضور</th><td>١٠:٠٠ صباحاً</td><th>وقت الانصراف</th><td>٦:٠٠ مساءً</td></tr></table>';
        h+=SC('٦','بنود عامة');
        h+='<div class="wb wb-bl" style="font-size:9px">⊳ يخضع هذا العقد لأحكام قانون العمل المصري رقم ١٢ لسنة ٢٠٠٣ واللائحة التنظيمية الداخلية للشركة.<br>⊳ يلتزم الطرف الثاني بالحفاظ على سرية بيانات ومعلومات العمل أثناء وبعد انتهاء الخدمة.<br>⊳ يجوز إنهاء هذا العقد من أي من الطرفين بإخطار كتابي مسبق وفقاً للمدة المحددة في اللائحة التنظيمية.</div>';
        h+=SC('٧','التوقيعات');
        h+=SG3('الطرف الثاني (الموظف)','بالقبول والالتزام',
               'المدير الإداري / مدير المشروعات','مراجعة',
               'المدير التنفيذي','اعتماد الطرف الأول',
               null,'admin','exec');
        h+=FT(['نسخة للموظف','نسخة للملف الشخصي','نسخة للأرشيف']);
    }

    // ── تكليف بمهمة ───────────────────────────────────────────────────
    else if(id==="task"){
        h=H('تكليف بمهمة عمل','تحديد المهام والمسؤوليات والمواعيد','TASK ASSIGNMENT','task');
        h+=SC('١','بيانات الموظف');
        h+=F2(FGE('اسم الموظف المُكلَّف'),FG('القسم / الإدارة'));
        h+=SC('٢','نوع المهمة');
        h+='<div class="chk-grid" style="grid-template-columns:1fr 1fr">'+
           '<label><input type="radio" name="ttype" value="admin" class="tpl-default-radio" checked onclick="updTaskSigs(this)"> 🏢 مهمة إدارية / مشروع</label>'+
           '<label><input type="radio" name="ttype" value="tech" onclick="updTaskSigs(this)"> 💻 مهمة تقنية</label>'+
           '</div>';
        h+=SC('٣','تفاصيل المهمة');
        h+='<div class="fg"><label>عنوان المهمة / المشروع</label><input type="text" style="font-weight:bold;color:var(--nv)"></div>';
        h+=FGA('وصف المهمة والأهداف',5);
        h+=F2(FG('تاريخ البدء','date'),FG('الموعد النهائي','date'));
        h+=SC('٤','الموارد الممنوحة');
        h+=FGA('',3,'الميزانية، الفريق، الأدوات...');
        h+=SC('٥','التوقيعات');
        h+='<div class="sigs">'+
           _sig('الموظف المكلَّف','','الاستلام والالتزام')+
           _sig('المدير الإداري / مدير المشروعات',MGRS.admin,'الموافقة والاعتماد','task-approver-sig')+
           _sig('المدير التنفيذي',MGRS.exec,'الإصدار')+
           '</div>';
        h+=FT();
    }

    // ── شهادة راتب ────────────────────────────────────────────────────
    else if(id==="sal"){
        h=H('شهادة راتب','إلى من يهمه الأمر — شهادة مفردات مرتب','SALARY CERTIFICATE','sal',true);
        h+='<div class="cert" style="font-size:13px">';
        h+='تشهد شركة <strong><span class="dcn"></span></strong> بأن الموظف أدناه يعمل لدينا ولا يزال على رأس عمله.<br><br>';
        h+='<table class="dt" style="margin:16px 0;border:2px solid var(--bd)"><tr><th style="width:30%;text-align:right;background:var(--bg);color:var(--tx)">اسم الموظف</th><td style="text-align:right"><input type="text" class="emp-name-fld" list="tgEmpDL" autocomplete="off" onchange="addEmployeeName(this.value)" style="font-weight:bold;text-align:right"></td></tr><tr><th style="text-align:right;background:var(--bg);color:var(--tx)">الرقم الوظيفي</th><td style="text-align:right"><input type="text" style="text-align:right"></td></tr><tr><th style="text-align:right;background:var(--bg);color:var(--tx)">المسمى الوظيفي</th><td style="text-align:right"><input type="text" style="text-align:right"></td></tr><tr><th style="text-align:right;background:var(--bg);color:var(--tx)">الراتب الأساسي</th><td style="text-align:right"><input type="text" style="text-align:right;width:130px"></td></tr><tr><th style="text-align:right;background:var(--bd);color:var(--nv);font-weight:800">إجمالي الراتب</th><td style="text-align:right;background:var(--bd)"><input type="text" class="sal-total-fld" style="font-weight:bold;text-align:right"></td></tr></table>';
        h+='لتقديمها إلى: <input type="text" style="width:180px"> دون مسؤولية على الشركة.';
        h+='<div style="margin-top:40px;display:flex;justify-content:space-between;align-items:flex-end;text-align:center">'+
           '<div><div style="font-weight:700;color:var(--nv);margin-bottom:24px">الختم</div>'+
           '<div style="width:90px;height:90px;border:2px dashed #cbd5e0;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#a0aec0;font-size:8px">ختم</div></div>'+
           '<div style="text-align:center"><div style="font-weight:700;color:var(--nv);margin-bottom:6px">المدير التنفيذي</div>'+
           '<div class="cert-mgr-nm">'+(MGRS.exec||'&nbsp;')+'</div>'+
           '<div style="border-bottom:1.5px solid #333;width:200px;margin:0 auto"></div></div>'+
           '</div>';
        h+=FT(['نسخة للموظف','نسخة للأرشيف']);
    }

    // ── سند استلام راتب ────────────────────────────────────────────────────
    else if(id==="salrec"){
        h=H('سند استلام راتب','إقرار استلام الأجر الشهري والمستحقات المالية','SALARY RECEIPT VOUCHER','salrec',true);
        h+='<div class="cert" style="font-size:13px">';
        h+='أقر أنا الموظف المذكور أدناه بأني قد استلمت من شركة <strong><span class="dcn"></span></strong> كامل مستحقاتي عن الفترة الموضحة أدناه وفق التفاصيل التالية:<br><br>';
        h+='<table class="dt" style="margin:16px 0;border:2px solid var(--bd)">'+
           '<tr>'+
             '<th style="width:25%;text-align:right;background:var(--bg);color:var(--tx)">اسم الموظف</th>'+
             '<td style="text-align:right"><input type="text" class="emp-name-fld" list="tgEmpDL" autocomplete="off" onchange="addEmployeeName(this.value)" style="font-weight:bold;text-align:right"></td>'+
             '<th style="width:25%;text-align:right;background:var(--bg);color:var(--tx)">الرقم الوظيفي</th>'+
             '<td style="text-align:right"><input type="text" class="emp-code-fld" style="text-align:right"></td>'+
           '</tr>'+
           '<tr>'+
             '<th style="text-align:right;background:var(--bg);color:var(--tx)">المسمى الوظيفي</th>'+
             '<td style="text-align:right"><input type="text" class="emp-job-fld" style="text-align:right"></td>'+
             '<th style="text-align:right;background:var(--bg);color:var(--tx)">القسم / الإدارة</th>'+
             '<td style="text-align:right"><input type="text" style="text-align:right"></td>'+
           '</tr>'+
           '<tr>'+
             '<th style="text-align:right;background:var(--bg);color:var(--tx)">عن شهر / فترة</th>'+
             '<td style="text-align:right"><input type="text" placeholder="مثال: يوليو 2026" style="text-align:right;font-weight:bold"></td>'+
             '<th style="text-align:right;background:var(--bg);color:var(--tx)">طريقة الصرف</th>'+
             '<td style="text-align:right"><select style="width:100%;padding:4px;border:1px solid var(--bd);border-radius:4px;background:var(--w);color:var(--tx)"><option>نقداً (Cash)</option><option>تحويل بنكي (Bank Transfer)</option><option>شيك (Cheque)</option><option>محفظة إلكترونية (E-Wallet)</option></select></td>'+
           '</tr>'+
           '</table>';
        
        h+='<div style="font-weight:700;color:var(--nv);margin:16px 0 8px 0;font-size:14px">📊 بيان تفاصيل الراتب والمستحقات (جنيه):</div>';
        h+='<table class="dt" style="margin:8px 0 16px 0;border:2px solid var(--bd)">'+
           '<thead>'+
             '<tr style="background:var(--bg);color:var(--tx)">'+
               '<th style="text-align:right;width:50%">البيان / البند</th>'+
               '<th style="text-align:center;width:50%">المبلغ</th>'+
             '</tr>'+
           '</thead>'+
           '<tbody>'+
             '<tr><td style="text-align:right;font-weight:600">الراتب الأساسي</td><td><input type="number" id="sr_basic" placeholder="0" oninput="calcSalRec()" style="text-align:center;font-weight:bold"></td></tr>'+
             '<tr><td style="text-align:right">بدلات (سكن / مواصلات / طبيعة عمل)</td><td><input type="number" id="sr_allow" placeholder="0" oninput="calcSalRec()" style="text-align:center"></td></tr>'+
             '<tr><td style="text-align:right">مكافآت / حوافز / أجر إضافي (+)</td><td><input type="number" id="sr_bonus" placeholder="0" oninput="calcSalRec()" style="text-align:center"></td></tr>'+
             '<tr style="background:rgba(46,204,113,0.1)"><td style="text-align:right;font-weight:700;color:#27ae60">إجمالي المستحقات (الإضافات)</td><td><input type="number" id="sr_gross" readonly style="text-align:center;font-weight:bold;color:#27ae60"></td></tr>'+
             '<tr><td style="text-align:right;color:var(--no)">استقطاعات / خصومات / سلف (-)</td><td><input type="number" id="sr_deduct" placeholder="0" oninput="calcSalRec()" style="text-align:center;color:var(--no)"></td></tr>'+
             '<tr style="background:var(--bd)"><td style="text-align:right;font-weight:800;color:var(--nv);font-size:14px">صافي المبلغ المستلم فعلياً</td><td><input type="text" class="sal-total-fld" id="sr_net" placeholder="0.00" style="text-align:center;font-weight:900;font-size:15px;color:var(--nv)"></td></tr>'+
           '</tbody>'+
           '</table>';
        
        h+='<div style="background:var(--bg);padding:12px 16px;border-radius:6px;border:1px solid var(--bd);margin:16px 0;font-size:12px;line-height:1.7">'+
           '<strong>تعهد وإقرار:</strong> أقر بأني استلمت المبلغ المذكور أعلاه كاملاً كصافي مستحقات عن الشهر المشار إليه، وبناءً عليه يعتبر هذا السند مخالصة مالية عن هذه الفترة دون أي مديونية أو التزام قائم على الشركة.'+
           '</div>';

        h+='<div style="margin-top:30px;display:flex;justify-content:space-between;align-items:flex-end;text-align:center">'+
           '<div>'+
              '<div style="font-weight:700;color:var(--nv);margin-bottom:6px">توقيع المستلم (الموظف)</div>'+
              '<div style="font-size:11px;color:var(--tx3);margin-bottom:20px">(استلمت المبلغ كاملاً)</div>'+
              '<div style="border-bottom:1.5px solid #333;width:160px;margin:0 auto"></div>'+
           '</div>'+
           '<div>'+
              '<div style="font-weight:700;color:var(--nv);margin-bottom:6px">المحاسب / مسؤول المالية</div>'+
              '<div style="font-size:11px;color:var(--tx3);margin-bottom:20px">(إعداد وتدقيق)</div>'+
              '<div style="border-bottom:1.5px solid #333;width:160px;margin:0 auto"></div>'+
           '</div>'+
           '<div>'+
              '<div style="font-weight:700;color:var(--nv);margin-bottom:24px">الختم الرسمي</div>'+
              '<div style="width:85px;height:85px;border:2px dashed #cbd5e0;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#a0aec0;font-size:9px">ختم الشركة</div>'+
           '</div>'+
           '<div>'+
              '<div style="font-weight:700;color:var(--nv);margin-bottom:6px">اعتماد المدير التنفيذي</div>'+
              '<div class="cert-mgr-nm" style="margin-bottom:4px">'+(MGRS.exec||'&nbsp;')+'</div>'+
              '<div style="border-bottom:1.5px solid #333;width:160px;margin:0 auto"></div>'+
           '</div>'+
           '</div>';
        h+=FT(['نسخة للموظف','نسخة للحسابات','نسخة للأرشيف']);
    }

    // ── الحضور والانصراف ──────────────────────────────────────────────
    else if(id==="att"){
        h='<div style="background:var(--w);border:1px solid var(--bd);border-radius:6px;overflow:hidden">';
        h+='<div style="background:var(--nv);color:#fff;padding:10px 20px;display:flex;align-items:center;justify-content:space-between">';
        h+='<div><span style="font-size:15px;font-weight:800">⏱ نظام الحضور والانصراف</span><br><span style="font-size:10px;opacity:.6">تحليل البيانات · WFH · التقارير التفصيلية</span></div>';
        h+='<div class="np"><button class="bt bt-g" onclick="document.getElementById(\'attF\').contentWindow.print()">🖨 طباعة التقرير</button></div>';
        h+='</div>';
        h+='<iframe id="attF" src="attendance.html" style="width:100%;height:calc(100vh - 100px);border:none"></iframe>';
        h+='</div>';
    }

    // ── الحضور الحي (مباشر) ───────────────────────────────────────────
    else if(id==="att_live"){
        var todayDate = new Date().toISOString().split('T')[0];
        h='<div style="background:var(--w);border:1px solid var(--bd);border-radius:6px;padding:20px">';
        h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">';
        h+='<div><h2 style="margin:0;color:var(--nv);font-size:18px">📡 سجل الحضور الحي (مباشر)</h2><p style="margin:4px 0 0;color:var(--tx3);font-size:13px">يعرض حركات تسجيل الدخول والخروج من حسابات الموظفين مباشرة</p></div>';
        h+='<div style="display:flex;gap:10px;align-items:center"><input type="date" id="liveAttDate" value="'+todayDate+'" onchange="fetchLiveAttendance()" style="padding:8px 12px;border-radius:6px;border:1px solid var(--bd);outline:none;font-family:inherit"><button class="bt bt-o" onclick="fetchLiveAttendance()">🔄 تحديث</button></div>';
        h+='</div>';
        h+='<div style="overflow-x:auto"><table class="dt" style="width:100%;text-align:center" id="liveAttTable">';
        h+='<thead><tr><th style="text-align:center">اسم الموظف</th><th style="text-align:center">تاريخ اليوم</th><th style="text-align:center">وقت الدخول</th><th style="text-align:center">وقت الخروج</th><th style="text-align:center">ساعات العمل</th></tr></thead>';
        h+='<tbody id="liveAttBody"><tr><td colspan="5" style="padding:20px;color:var(--tx3)">جارٍ جلب البيانات...</td></tr></tbody>';
        h+='</table></div>';
        h+='</div>';
        setTimeout(function(){ if(typeof window.fetchLiveAttendance === 'function') window.fetchLiveAttendance(); }, 100);
    }

    // ── الشكاوى والمقترحات ─────────────────────────────────────────────
    else if(id==="comp"){
        h=H('الشكاوى والمقترحات','صوتك مسموع — نحن نهتم برأيك','COMPLAINTS & SUGGESTIONS','comp');
        h+=SC('١','نوع التقديم');
        h+='<div class="ctg"><div class="ctc sel" onclick="sct(this)"><div class="ci">💡</div><div class="ct3">مقترح تطويري</div></div><div class="ctc" onclick="sct(this)"><div class="ci">🏢</div><div class="ct3">شكوى بيئة العمل</div></div><div class="ctc" onclick="sct(this)"><div class="ci">👥</div><div class="ct3">شكوى إدارية</div></div><div class="ctc" onclick="sct(this)"><div class="ci">🔧</div><div class="ct3">صيانة / مرافق</div></div></div>';
        h+=SC('٢','بيانات مقدم الطلب');
        h+='<div style="padding:0 0 8px 0"><label style="display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer"><input type="checkbox" onchange="toggleAnon(this)"> تقديم بسرية تامة (بدون ذكر الاسم)</label></div>';
        h+='<div class="fr fr3" id="cud">'+FG('الاسم')+FG('القسم')+FG('التاريخ','date')+'</div>';
        h+=SC('٣','التفاصيل');
        h+='<div style="margin-bottom:8px"><label style="font-size:10px;font-weight:600;color:var(--tx2)">مستوى الأهمية</label><div class="pp"><div class="ppl hi" onclick="spr(this)">عاجل</div><div class="ppl md a" onclick="spr(this)">متوسط</div><div class="ppl lo" onclick="spr(this)">عادي</div></div></div>';
        h+='<div class="fg"><label>الموضوع</label><input type="text"></div>';
        h+=FGA('الوصف التفصيلي',5);
        h+=SC('٤','الإجراءات المتخذة');
        h+=F2(FG('تاريخ الاستلام','date'),FG('المسؤول عن المتابعة'));
        h+=FGA('القرارات المتخذة',3);
        h+=SG3('مقدم الطلب','','المدير الإداري / مدير المشروعات','استلام وإجراء','المدير التنفيذي','الاعتماد النهائي',null,'admin','exec');
        h+=FT();
    }

    // ── شيت المصروفات الشهري ────────────────────────────────────────────
    else if(id==="mexp"){
        var mexpNum=genDocNum('mexp');
        h=H('شيت المصروفات الشهري','تسجيل وتوثيق حركة المصروفات النقدية للشركة','MONTHLY EXPENSE SHEET','mexp');
        h+=SC('١','بيانات الشهر');
        h+='<div class="fr fr3">'+
           '<div class="fg"><label>الشهر</label><input type="month" id="mexp-month" onchange="mexpLoad()"></div>'+
           '<div class="fg"><label>عدد الحركات</label><input type="text" id="mexp-count" readonly></div>'+
           '<div class="fg"><label>إجمالي المصروفات</label><input type="text" id="mexp-total" readonly style="font-weight:900;color:var(--nv)"></div>'+
           '</div>';
        h+=SC('٢','تفاصيل المصروفات');
        h+='<div class="np" style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">'+
           '<button class="bt bt-p" onclick="mexpAddRow()">➕ إضافة سطر</button>'+
           '<button class="bt bt-o" onclick="mexpSave()">💾 حفظ بيانات الشهر</button>'+
           '<button class="bt bt-g" onclick="mexpPrint()">🖨 طباعة الشيت / PDF</button>'+
           '</div>';
        h+='<table class="dt" id="mexp-table">'+
           '<thead><tr><th style="width:36px">م</th><th style="width:20%">اسم الصارف</th><th style="width:40%">بند (نوع) الصرف</th><th style="width:110px">العدد (المبلغ)</th><th style="width:120px">التاريخ</th><th style="width:15%">ملاحظات</th><th class="np" style="width:30px"></th></tr></thead>'+
           '<tbody id="mexp-tbody"></tbody>'+
           '<tfoot><tr><td colspan="3" style="text-align:left;font-weight:800;background:#edf2f7">الإجمالي</td><td id="mexp-total-cell" style="font-weight:900;color:var(--nv);background:#edf2f7"></td><td colspan="3" style="background:#edf2f7"></td></tr></tfoot>'+
           '</table>';
        h+=SC('٣','الاعتماد والتوقيعات');
        h+=SG3('أمين الصندوق / المسؤول عن الصرف','تحرير وتوثيق البيانات',
               'المدير الإداري / مدير المشروعات','مراجعة واعتماد',
               'المدير التنفيذي','اعتماد نهائي',
               null,'admin','exec');
        h+=FT();
    }

    // ── إدارة المشاريع (إنشاء المشاريع وتعيين الموظفين مباشرة) ─────────
    else if(id==="pmgmt"){
        h='<div class="SP"><h3>📁 إدارة المشاريع</h3>';
        h+='<div class="set-hint">أنشئ مشروعاً جديداً وحدد الموظفين المسؤولين عنه مباشرة من هنا، بدل الدخول على Firebase Console يدوياً. كل موظف بعدها يقدر يحدّث نسبة تقدّمه في المشروع من بوابته الخاصة (employee.html)، ويقدر يتواصل مع باقي الفريق والأدمن من خلال نقاش المشروع.</div>';

        h+='<div id="pmgmtListViewContainer">';
        h+='<div class="set-sec"><div class="set-sec-title">➕ إنشاء مشروع جديد</div>';
        h+='<div class="fg" style="margin-bottom:10px"><label>عنوان المشروع</label><input type="text" id="pmTitle" placeholder="مثلاً: تطوير نظام إدارة المخازن"></div>';
        h+='<div class="fg fg-full" style="margin-bottom:10px"><label>وصف مختصر</label><textarea rows="2" id="pmDesc" placeholder="نبذة مختصرة عن المشروع وأهدافه..."></textarea></div>';
        h+='<div class="fr fr3" style="margin-bottom:10px">'+
           '<div class="fg"><label>الأولوية</label><select id="pmPriority"><option>منخفضة</option><option selected>متوسطة</option><option>عالية</option></select></div>'+
           '<div class="fg"><label>حالة المشروع</label><select id="pmStatus"><option selected>مخطط له</option><option>جاري العمل</option><option>متوقف</option><option>مكتمل</option></select></div>'+
           '<div class="fg"><label>تاريخ الاستحقاق (اختياري)</label><input type="date" id="pmDeadline"></div>'+
           '</div>';
        h+='<div class="fg fg-full" style="margin-bottom:6px"><label>الموظفون المسؤولون عن المشروع</label></div>';
        h+='<div class="chk-grid" id="pmgmtAssignees"><div class="empty-hint">⏳ جارٍ تحميل قائمة الموظفين...</div></div>';
        h+='<div class="fr fr2" style="margin-top:10px">';
        h+='  <div class="fg" style="justify-content: flex-end;">';
        h+='    <label class="file-upload-label" style="text-align:center;display:block;margin-bottom:0">';
        h+='      📎 ملف أو صورة مرفقة';
        h+='      <input type="file" id="pmFile" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" style="display:none" onchange="document.getElementById(\'pmFileName\').textContent=this.files[0]?this.files[0].name:\'\'">';
        h+='    </label>';
        h+='    <span id="pmFileName" style="font-size:11px;color:var(--tx3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;margin-top:4px"></span>';
        h+='  </div>';
        h+='  <div class="fg"><label>رابط خارجي (اختياري)</label><input type="url" id="pmLink" placeholder="https://example.com"></div>';
        h+='</div>';
        h+='<div id="pmUploadProg" style="display:none" class="file-upload-progress"></div>';
        h+='<button class="bt bt-p" style="margin-top:12px" onclick="createProject()">➕ إنشاء المشروع</button>';
        h+='<div id="pmCreateMsg" style="margin-top:8px;font-size:11px"></div>';
        h+='</div>';

        h+='<div style="display:flex;justify-content:space-between;align-items:center;margin:18px 0 10px">';
        h+='<div style="display:flex;align-items:center;gap:10px;"><div class="set-sec-title" style="margin:0">📁 المشاريع الحالية</div>';
        h+='<select class="global-table-filter" style="margin:0;padding:4px;font-size:11px;min-height:auto;" onchange="tgSortVisibleList(this.value)">'+
           '<option value="">-- فرز حسب --</option><option value="date_desc">الأحدث</option><option value="date_asc">الأقدم</option><option value="prio_desc">الأولوية</option><option value="status_desc">الحالة</option><option value="deadline_asc">تاريخ التسليم</option><option value="emp_asc">الموظف المكلف</option></select>';
        h+='<select id="tgProjsEmpFilter" class="global-table-filter" style="margin:0;padding:4px;font-size:11px;min-height:auto;" onchange="tgFilterByEmployee(this.value, \'staff-card\')"><option value="">تصفية بالموظف</option></select></div>';
        h+='<button class="bt bt-d" style="padding:5px 14px;font-size:11px" onclick="tgDeleteAllRecords(\'projects\', \'المشاريع\', null, null, loadPmgmtData)">🗑 حذف الكل</button>';
        h+='</div>';
        h+='<div id="pmgmtList"><div class="empty-hint">⏳ جارٍ تحميل المشاريع...</div></div>';
        h+='</div>'; // close pmgmtListViewContainer
        h+='<div id="pmgmtDetailViewContainer" style="display:none"></div>';
        h+='</div>';
    }

    // ── توزيع المهام (الأدمن يكلّف كل موظف بمهمة يقدر يتابعها من بوابته) ─
    else if(id==="tasksmgmt"){
        h='<div class="SP"><h3>🗂 توزيع المهام</h3>';
        h+='<div class="set-hint">كلّف أي موظف بمهمة محددة، وهيقدر يشوفها ويحدّث حالتها (لم يبدأ / جاري العمل / مكتمل) من بوابته الخاصة (employee.html) تحت تبويب "مهامي".</div>';

        h+='<div class="set-sec"><div class="set-sec-title">➕ تكليف مهمة جديدة</div>';
        h+='<div class="fr fr2" style="margin-bottom:10px">'+
           '<div class="fg"><label>الموظف المكلَّف</label><select id="tkAssignee"><option value="">⏳ جارٍ تحميل قائمة الموظفين...</option></select></div>'+
           '<div class="fg"><label>الأولوية</label><select id="tkPriority"><option>منخفضة</option><option selected>متوسطة</option><option>عالية</option></select></div>'+
           '</div>';
        h+='<div class="fg" style="margin-bottom:10px"><label>عنوان المهمة</label><input type="text" id="tkTitle" placeholder="مثلاً: تجهيز تصميمات كتالوج المنتجات"></div>';
        h+='<div class="fg fg-full" style="margin-bottom:10px"><label>تفاصيل المهمة (اختياري)</label><textarea rows="2" id="tkDesc"></textarea></div>';
        h+='<div class="fr fr2" style="margin-bottom:10px">';
        h+='  <div class="fg"><label>تاريخ التسليم (اختياري)</label><input type="date" id="tkDeadline"></div>';
        h+='  <div class="fg" style="justify-content: flex-end; margin-bottom: 2px;">';
        h+='    <label class="file-upload-label" style="margin-bottom: 0; align-self: stretch; text-align: center; display: block;">';
        h+='      📎 مرفق اختياري';
        h+='      <input type="file" id="tkFile" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" style="display:none" onchange="document.getElementById(\'tkFileName\').textContent=this.files[0]?this.files[0].name:\'\'">';
        h+='    </label>';
        h+='    <span id="tkFileName" style="font-size:11px;color:var(--tx3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;margin-top:4px"></span>';
        h+='  </div>';
        h+='</div>';
        h+='<div id="tkUploadProg" style="display:none" class="file-upload-progress"></div>';
        h+='<button class="bt bt-p" onclick="createTask()">➕ تكليف المهمة</button>';
        h+='<div id="tkCreateMsg" style="margin-top:8px;font-size:11px"></div>';
        h+='</div>';

        h+='<div style="display:flex;justify-content:space-between;align-items:center;margin:24px 0 16px;flex-wrap:wrap;gap:12px">';
        h+='<div class="set-sec-title" style="margin:0">🗂 المهام الحالية</div>';
        h+='<button class="bt bt-d" style="padding:5px 14px;font-size:11px" onclick="tgDeleteAllRecords(\'tasks\', \'المهام\', null, null, loadTasksMgmt)">🗑 حذف الكل</button>';
        h+='</div>';
        
        h+='<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;border-bottom:2px solid var(--bd);padding-bottom:2px" id="tgTaskStatusTabs">';
        h+='<button class="tg-task-tab tg-task-tab-active" data-status="" onclick="tgSetTaskStatusTab(this, \'\')"><span class="tab-label">الكل</span><span class="tab-count" id="tab-count-all">0</span></button>';
        h+='<button class="tg-task-tab" data-status="1" onclick="tgSetTaskStatusTab(this, \'1\')"><span class="tab-label">لم يبدأ</span><span class="tab-count" id="tab-count-1">0</span></button>';
        h+='<button class="tg-task-tab" data-status="2" onclick="tgSetTaskStatusTab(this, \'2\')"><span class="tab-label">جاري العمل</span><span class="tab-count" id="tab-count-2">0</span></button>';
        h+='<button class="tg-task-tab" data-status="3" onclick="tgSetTaskStatusTab(this, \'3\')"><span class="tab-label">مكتمل</span><span class="tab-count" id="tab-count-3">0</span></button>';
        h+='<button class="tg-task-tab" data-status="late" onclick="tgSetTaskStatusTab(this, \'late\')"><span class="tab-label">متأخرة</span><span class="tab-count" id="tab-count-late">0</span></button>';
        h+='</div>';
        
        h+='<div id="tasksMgmtList"><div class="empty-hint">⏳ جارٍ تحميل المهام...</div></div>';
        h+='</div>';
    }

    // ── متابعة الموظفين (بيانات حية من Firebase) ─────────────────────
    else if(id==="staff"){
        var isFullAdm = typeof isFullAdmin === 'function' && isFullAdmin();
        h='<div class="SP"><h3>👥 متابعة الموظفين</h3>';
        h+='<div class="set-hint">نظرة شاملة على كل موظف: المشاريع المُسندة إليه ونسبة تقدّمه فيها، الإنجازات، وطلباته — مع إمكانية الموافقة أو الرفض مباشرة.</div>';

        // إشعار بادج
        h+='<div id="staffListViewContainer">';
        h+='<div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap">';
        h+='<div style="display:flex;align-items:center;gap:8px;background:rgba(231,76,60,.08);border:1.5px solid rgba(231,76,60,.25);padding:10px 16px;border-radius:10px;cursor:pointer" onclick="clearAdminBadge(\'notif-req-badge\',\'notif-req-badge-sb\')">';
        h+='📨 طلبات جديدة <span id="notif-req-badge" style="display:none;background:var(--no);color:#fff;border-radius:50%;min-width:20px;height:20px;font-size:11px;font-weight:800;align-items:center;justify-content:center;padding:0 4px">0</span></div>';
        h+='<div style="display:flex;align-items:center;gap:8px;background:rgba(39,174,96,.08);border:1.5px solid rgba(39,174,96,.25);padding:10px 16px;border-radius:10px;cursor:pointer" onclick="clearAdminBadge(\'notif-wkr-badge\',\'notif-wkr-badge-sb\')">';
        h+='📆 تقارير أسبوعية جديدة <span id="notif-wkr-badge" style="display:none;background:var(--ok);color:#fff;border-radius:50%;min-width:20px;height:20px;font-size:11px;font-weight:800;align-items:center;justify-content:center;padding:0 4px">0</span></div>';
        h+='<button class="bt bt-g" onclick="sendWeeklyReportReminder()" style="min-width:120px" id="sysrepReminderBtn">🔔 تذكير الموظفين بالتقرير الأسبوعي</button>';
        h+='</div>';

        h+='<div class="set-sec"><div class="set-sec-title">➕ إضافة حساب جديد</div>';
        h+='<div class="set-hint">أنشئ بريد إلكتروني وكلمة مرور للموظف حتى يدخل بوابته، أو أنشئ حساب أدمن تقني يملك صلاحية إضافة المشاريع فقط.</div>';
        h+='<div class="fr fr3" style="margin-top:10px">';
        h+='<div class="fg"><label>اسم المستخدم</label><input type="text" id="newAccName" class="emp-name-fld" list="tgEmpDL" autocomplete="off"></div>';
        h+='<div class="fg"><label>البريد الإلكتروني</label><input type="email" id="newAccEmail" placeholder="name@techgo.com"></div>';
        h+='<div class="fg"><label>كلمة مرور مبدئية</label><input type="text" id="newAccPass" placeholder="6 أحرف على الأقل"></div>';
        h+='</div>';
        h+='<div class="fr fr3" style="margin-top:10px">';
        h+='<div class="fg"><label>المسمى الوظيفي (اختياري)</label><input type="text" id="newAccJobTitle" placeholder="مثلاً: مصمم جرافيك"></div>';
        h+='<div class="fg"><label>القسم / الإدارة (اختياري)</label><input type="text" id="newAccDept" placeholder="مثلاً: قسم تكنولوجيا المعلومات"></div>';
        h+='<div class="fg"><label>رقم الهاتف (اختياري)</label><input type="text" id="newAccPhone" placeholder="مثلاً: 01012345678"></div>';
        h+='</div>';
        h+='<div class="fr fr2" style="margin-top:10px">';
        h+='<div class="fg"><label>نظام العمل</label><select id="newAccWorkMode"><option value="office">من المكتب</option><option value="remote">عن بُعد (ريموتلي)</option></select></div>';
        h+='<div class="fg"><label>دور الحساب</label><select id="newAccRole"><option value="employee">موظف (employee)</option><option value="tech_admin">أدمن تقني (بدون صلاحيات إدارية)</option></select></div>';
        h+='</div>';
        h+='<button class="bt bt-p" onclick="createStaffAccount()">➕ إنشاء الحساب</button>';
        h+='<div id="newAccMsg" style="margin-top:8px;font-size:11px"></div>';
        h+='</div>';

        h+='<div style="display:flex;align-items:center;gap:12px;margin:18px 0 10px">';
        h+='<div class="set-sec-title" style="margin:0">👥 قائمة الموظفين</div>';
        h+='</div>';
        h+='<div class="staff-toolbar">';
        h+='<input type="text" class="staff-search" id="staffSearch" oninput="filterStaffCards()" placeholder="🔍 ابحث بالاسم أو البريد الإلكتروني...">';
        h+='<span class="staff-count" id="staffCount"></span>';
        h+='</div>';
        h+='<div id="staffList"><div class="empty-hint">⏳ جارٍ تحميل بيانات الموظفين...</div></div>';
        h+='</div>'; // close staffListViewContainer
        h+='<div id="staffDetailViewContainer" style="display:none"></div>';
        h+='</div>';
    }

    // ── بريد التقارير الأسبوعية ─────────────────────────────────────────
    else if(id==="wkreports"){
        h='<div class="SP"><h3>📥 بريد التقارير الأسبوعية</h3>';
        h+='<div class="set-hint">كل التقارير الأسبوعية المُرسلة من الموظفين في مكان واحد — فلترة حسب الموظف أو الأسبوع، تحديد ما تمت مراجعته، وطباعة مباشرة.</div>';
        h+='<div id="wkrInboxStats" style="display:flex;gap:10px;margin:14px 0;flex-wrap:wrap"></div>';
        h+='<div class="staff-toolbar">';
        h+='<select id="wkrInboxEmpFilter" class="global-table-filter" style="width:220px" onchange="renderWeeklyReportsInbox()"><option value="all">كل الموظفين</option></select>';
        h+='<select id="wkrInboxWeekFilter" class="global-table-filter" style="width:180px" onchange="renderWeeklyReportsInbox()"><option value="all">كل الأسابيع</option></select>';
        h+='<select id="wkrInboxStatusFilter" class="global-table-filter" style="width:170px" onchange="renderWeeklyReportsInbox()">'+
           '<option value="all">كل الحالات</option><option value="unreviewed">⏳ غير مراجَعة</option><option value="reviewed">✅ تمت مراجعتها</option></select>';
        h+='</div>';
        h+='<div id="wkrInboxList" style="margin-top:14px"><div class="empty-hint">⏳ جارٍ تحميل التقارير...</div></div>';
        h+='</div>';
        c.innerHTML = h;
        loadWeeklyReportsInbox();
        clearAdminBadge('notif-wkr-badge','notif-wkr-badge-sb');
        return;
    }

    // ── التقويم العام ──────────────────────────────────────────────────
    else if(id==="cal"){
        h='<div class="SP"><h3>📅 التقويم العام</h3>';
        h+='<div class="set-hint">عرض مواعيد تسليم المشاريع والمهام المُسندة بشكل تقويم تفاعلي.</div>';
        h+='<div id="generalCalendar" style="margin-top:20px; background:var(--w); padding:15px; border-radius:12px; border:1px solid var(--bd); box-shadow:0 4px 12px rgba(0,0,0,0.05); min-height:500px"></div>';
        h+='</div>';
    }

    // ── تخصيص النظام ──────────────────────────────────────────────────
    else if(id==="set"){
        h='<div class="SP"><h3>⚙️ تخصيص النظام</h3>';

        h+='<div class="set-sec"><div class="set-sec-title">🏢 بيانات الشركة</div>';
        h+='<div class="fg" style="margin-bottom:14px"><label>اسم الشركة</label><input type="text" id="sn" value="'+escH(CN)+'"></div>';
        h+='<div class="fg" style="margin-bottom:14px"><label>العنوان</label><input type="text" class="tpl-default" value="شارع التسعين، التجمع الخامس، القاهرة"></div>';
        h+=F2('<div class="fg"><label>الهاتف</label><input type="tel" class="tpl-default" value="01012345678"></div>','<div class="fg"><label>البريد</label><input type="email" class="tpl-default" value="hr@techgo.com"></div>');
        h+='</div>';

        h+='<div class="set-sec"><div class="set-sec-title">👔 المديرون المُفوَّضون بالتوقيع</div>';
        h+='<div class="set-hint">يظهر اسم كل مدير تلقائياً أسفل المسمى الوظيفي في خانات التوقيع بجميع النماذج والوثائق المُصدَرة.</div>';
        h+='<div class="mgr-row">'+
           '<div class="mgr-badge admin-badge">م.إداري / م.مشروعات</div>'+
           '<div class="fg" style="flex:1;margin:0"><label>المدير الإداري / مدير المشروعات</label>'+
           '<input type="text" id="sm_admin" value="'+escH(MGRS.admin)+'" placeholder="الاسم الكامل للمدير"></div>'+
           '</div>';
        h+='<div class="mgr-row">'+
           '<div class="mgr-badge exec-badge">م.تنفيذي</div>'+
           '<div class="fg" style="flex:1;margin:0"><label>المدير التنفيذي</label>'+
           '<input type="text" id="sm_exec" value="'+escH(MGRS.exec)+'" placeholder="الاسم الكامل للمدير"></div>'+
           '</div>';
        h+='<div class="mgr-row">'+
           '<div class="mgr-badge tech-badge">م.تقني</div>'+
           '<div class="fg" style="flex:1;margin:0"><label>المدير التقني <span style="font-size:9px;opacity:.7">(للمهام التقنية)</span></label>'+
           '<input type="text" id="sm_tech" value="'+escH(MGRS.tech)+'" placeholder="الاسم الكامل للمدير"></div>'+
           '</div>';
        h+='</div>';

        h+=empListSecHTML();

        h+='<div class="set-sec"><div class="set-sec-title">⏱ نظام الحضور والانصراف</div>';
        h+='<div class="fg" style="margin-bottom:14px"><label>تفعيل الميزة للموظفين</label><div class="chk-grid"><label><input type="checkbox" id="chkAttEnabled" '+(window._appSettingsCache&&window._appSettingsCache.attendanceEnabled!==false?'checked':'')+'> السماح للموظفين بتسجيل الحضور والانصراف عبر البوابة</label></div></div>';
        h+='<div class="fg" style="margin-bottom:14px"><label>وضع "العمل عن بُعد" الشامل</label><div class="chk-grid"><label><input type="checkbox" id="chkGlobalRemote" '+(window._appSettingsCache&&window._appSettingsCache.globalRemoteMode?'checked':'')+'> تفعيل وضع "العمل عن بُعد" (ريموتلي) لجميع الموظفين (يلغي الإعدادات الفردية)</label></div></div>';
        h+='<button class="bt bt-p" style="padding:6px 14px;font-size:12px" onclick="saveAppSettings()">💾 حفظ إعدادات النظام</button>';
        h+='</div>';

        h+='<div class="set-sec"><div class="set-sec-title">🤖 الذكاء الاصطناعي (Gemini / Groq / OpenRouter)</div>';
        h+='<div class="set-hint" style="margin-bottom:12px">ضع هنا مفتاح API الخاص بك (Gemini أو Groq أو OpenRouter) لتفعيل اقتراحات التطوير المهني. النظام سيتعرف عليه تلقائياً.</div>';
        h+='<div class="fr fr2"><div class="fg" style="margin:0"><input type="password" id="txtGeminiApi" placeholder="AIzaSy..." value="'+(window._appSettingsCache&&window._appSettingsCache.geminiApiKey?window._appSettingsCache.geminiApiKey:'')+'"></div></div>';
        h+='<button class="bt bt-p" style="padding:6px 14px;font-size:12px;margin-top:10px" onclick="saveAppSettings()">💾 حفظ إعدادات النظام</button>';
        h+='</div>';

        h+='<div class="set-sec"><div class="set-sec-title">📋 ترقيم المستندات</div>';
        h+='<div class="set-hint">يُنشأ رقم مستند تلقائي لكل ورقة تصدر من النظام بالصيغة: <strong>TG-السنة-الكود-التسلسل</strong><br>مثال: TG-'+new Date().getFullYear()+'-NTC-001 (لفت نظر) · TG-'+new Date().getFullYear()+'-LV-003 (إجازة) · TG-'+new Date().getFullYear()+'-TSK-007 (مهمة)</div>';
        h+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">';
        var codeList=[['EMP','ملف موظف'],['LV','إجازة'],['PM','إذن'],['DLY','التماس'],['NTC','لفت نظر'],['WRN','إنذار'],['INV','تحقيق'],['TSK','مهمة'],['CLR','إخلاء'],['SAL','شهادة راتب'],['REC','سند راتب'],['EXP','خبرة'],['CMP','شكوى'],['LA','إج.سنوية'],['LB','إج.عارضة'],['LC','أعياد'],['LD','غياب'],['MEXP','مصروفات شهرية'],['RES','استقالة'],['PRM','ترقية'],['CTR','عقد عمل'],['RAI','زيادة راتب']];
        for(var ci=0;ci<codeList.length;ci++){
            h+='<div class="code-chip"><span class="code-val">'+codeList[ci][0]+'</span><span class="code-lbl">'+codeList[ci][1]+'</span></div>';
        }
        h+='</div>';
        h+='<div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--bd,#ccd)">';
        h+='<div class="set-hint" style="margin-bottom:8px">إعادة ضبط أرقام التسلسل تجعل ترقيم كل النماذج يبدأ من <strong>001</strong> من جديد.</div>';
        h+='<button class="bt bt-d" onclick="resetSeq()">↺ تصفير أرقام المستندات</button>';
        h+='</div></div>';

        h+='<div class="set-sec"><div class="set-sec-title"><span>🗑</span> إعادة ضبط النظام</div>';
        h+='<div class="set-hint" style="color:var(--no);font-weight:600">تحذير: هذا الإجراء يحذف جميع البيانات الديناميكية نهائياً (مشاريع، مهام، تقارير، رسائل...).<br>لن يُؤثر على حسابات المستخدمين أو الإعدادات.</div>';
        h+='<button class="bt bt-d" onclick="resetSystem()">🗑 إعادة ضبط كل البيانات</button>';
        h+='</div>';

        // ── منطقة الخطر (حذف كل البيانات بما فيها الموظفين) ──
        h+='<div class="SP" style="margin-top:20px;border:2px solid var(--no)">';
        h+='<h3 style="color:var(--no)">&#9888;&#65039; منطقة الخطر</h3>';
        h+='<p style="font-size:13px;color:var(--tx);margin-bottom:16px">سيؤدي هذا إلى حذف <strong>جميع بيانات النظام</strong> بشكل نهائي لا يمكن التراجع عنه، بما في ذلك الموظفون، المشاريع، المهام، الطلبات، والإشعارات.<br><strong>باستثناء حسابك الحالي (المدير)</strong> — هيفضل موجوداً عشان تقدر تدخل على النظام بعد الحذف.</p>';
        h+='<button class="bt bt-d" style="padding:10px 24px;font-size:13px;font-weight:800" onclick="deleteAllSystemData()">&#128465; حذف جميع بيانات النظام</button>';
        h+='</div>';

        h+='<div style="text-align:left;margin-top:20px">'+
           '<button class="bt bt-p" onclick="saveSt()">💾 حفظ الإعدادات</button></div></div>';
    }

    // ── حسابي (إعدادات شخصية للأدمن) ──────────────────────────────────
    else if(id==="account"){
        h=myAccountHTML();
    }
    // ── إدارة الإعلانات ──────────────────────────────────────────────────────
    else if(id==="announcements"){
        h='<div class="SP">';
        h+='<h3>&#128226; إدارة الإعلانات</h3>';
        h+='<div class="fg fg-full" style="margin-bottom:12px">';
        h+='<label>نوع الإعلان</label>';
        h+='<div style="display:flex;gap:16px;margin-top:6px">';
        h+='<label style="display:flex;align-items:center;gap:6px;font-weight:400;cursor:pointer"><input type="radio" name="annAudience" value="all" checked onchange="toggleAnnTargetWrap()"> &#128226; عام لكل الموظفين</label>';
        h+='<label style="display:flex;align-items:center;gap:6px;font-weight:400;cursor:pointer"><input type="radio" name="annAudience" value="private" onchange="toggleAnnTargetWrap()"> &#128100; خاص لموظف معين</label>';
        h+='</div></div>';
        h+='<div class="fg fg-full" id="annTargetWrap" style="display:none;margin-bottom:12px">';
        h+='<label>الموظف المرسل إليه</label>';
        h+='<select id="annTargetEmployee"><option value="">جارٍ تحميل الموظفين...</option></select>';
        h+='</div>';
        h+='<div class="fr fr2" style="margin-bottom:12px">';
        h+='<div class="fg"><label>عنوان الإعلان</label><input type="text" id="annTitle"></div>';
        h+='<div class="fg"><label>التاريخ (اختياري)</label><input type="text" id="annDate" placeholder="مثال: 1 أكتوبر 2026"></div>';
        h+='</div>';
        h+='<div class="fg fg-full" style="margin-bottom:12px"><label>محتوى الإعلان</label><textarea id="annContent" rows="4"></textarea></div>';
        h+='<button class="bt bt-p" onclick="addAnnouncement()">&#128226; نشر الإعلان</button>';
        h+='<div id="annMsg" style="margin-top:10px;font-weight:bold;font-size:12px;"></div>';
        h+='<hr style="margin:30px 0;border:0;border-top:2px solid var(--bd2)">';
        h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
        h+='<h3 style="margin:0">&#128209; الإعلانات السابقة</h3>';
        h+='<button class="bt bt-d" style="padding:5px 14px;font-size:11px" onclick="deleteAllAnnouncements()">&#128465; حذف الكل</button>';
        h+='</div>';
        h+='<div id="annList" style="display:flex;flex-direction:column;gap:12px;"></div>';
        h+='</div>';
    }

    // ── ملفات الموظفين ──────────────────────────────────────────────────
    else if(id==="empdocs"){
        h='<div class="SP"><h3>📂 ملفات الموظفين</h3>';
        h+='<div class="set-hint">اختر الموظف لعرض وإدارة المستندات الرقمية الخاصة به (عقود، بطاقة شخصية، شهادات، إلخ).</div>';
        h+='<div class="search-bar" style="margin-bottom:16px"><input type="text" placeholder="🔍 ابحث بالاسم..." onkeyup="filterEmpDocsList(this.value)"></div>';
        h+='<div id="empDocsList"><div class="empty-hint">⏳ جارٍ تحميل الموظفين...</div></div>';
        h+='</div>';
    }

    c.innerHTML=h;
    if(id==="mexp") mexpInit();
    if(id==="staff") loadStaffOverview();
    if(id==="pmgmt") loadPmgmtData();
    if(id==="tasksmgmt") loadTasksMgmt();
    if(id==="announcements") { loadAdminAnnouncements(); loadAnnouncementTargetEmployees(); }
    if(id==="empdocs") loadEmpDocsOverview();
    if(id==="cal") initGeneralCalendar();
}
// ═══════════════════════════════════════════════════════════════
// ── الإعلانات ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function toggleAnnTargetWrap() {
    var checked = document.querySelector('input[name="annAudience"]:checked');
    var wrap = document.getElementById('annTargetWrap');
    if(!wrap) return;
    wrap.style.display = (checked && checked.value === 'private') ? 'block' : 'none';
}
function loadAnnouncementTargetEmployees() {
    var sel = document.getElementById('annTargetEmployee');
    if(!sel) return;
    db.collection('users').where('role','in',['employee','tech_admin']).get().then(function(snap) {
        if(snap.empty) { sel.innerHTML = '<option value="">لا يوجد موظفون مسجّلون</option>'; return; }
        var opts = '<option value="">اختر الموظف...</option>';
        var list = [];
        snap.forEach(function(doc) { list.push(Object.assign({uid:doc.id}, doc.data())); });
        list.sort(function(a,b){ return (a.name||'').localeCompare(b.name||'', 'ar'); });
        list.forEach(function(emp) {
            opts += '<option value="'+emp.uid+'">'+escH(emp.name||emp.email||emp.uid)+'</option>';
        });
        sel.innerHTML = opts;
    }).catch(function(err) {
        sel.innerHTML = '<option value="">تعذر تحميل الموظفين</option>';
        console.error(err);
    });
}
function loadAdminAnnouncements() {
    window.loadedAnnouncements = {};
    var box = document.getElementById('annList');
    if(!box) return;
    box.innerHTML = '<div class="empty-hint" style="color:var(--tx3)">&#9203; جارٍ التحميل...</div>';
    db.collection('announcements').orderBy('createdAt', 'desc').limit(20).get().then(function(snap) {
        if(snap.empty) { box.innerHTML = '<div class="empty-hint">لا توجد إعلانات سابقة.</div>'; return; }
        var h = '';
        snap.forEach(function(d) {
            var a = d.data();
            window.loadedAnnouncements[d.id] = a;
            var ts = (a.createdAt && a.createdAt.seconds) ? new Date(a.createdAt.seconds*1000).toLocaleDateString('ar-EG') : '';
            var isPrivate = a.audience === 'private';
            h += '<div class="pj-row" style="border-right:4px solid '+(isPrivate?'var(--gd)':'var(--nv)')+'">';
            h += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">';
            h += '<div class="pj-t" style="font-size:14px;font-weight:800">'+escH(a.title)+'</div>';
            h += isPrivate
                ? '<span class="badge" style="background:var(--gd);color:#1b2a4a">&#128100; خاص &rarr; '+escH(a.targetName||'موظف')+'</span>'
                : '<span class="badge" style="background:var(--nv);color:#fff">&#128226; عام لكل الموظفين</span>';
            h += '</div>';
            h += '<div class="pj-meta" style="margin:6px 0 10px;font-size:12px;color:var(--tx);line-height:1.6">'+escH(a.content)+'</div>';
            h += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">';
            h += '<div class="pj-meta" style="display:flex;gap:12px;opacity:0.85">';
            h += (a.date ? '<span>&#128197; '+escH(a.date)+'</span>' : '');
            h += (ts ? '<span>&#128336; نُشر: '+ts+'</span>' : '');
            h += (a.createdBy ? '<span>&#128100; '+escH(a.createdBy)+' ('+escH(a.createdByRole||'أدمن إداري')+')</span>' : '');
            h += '</div>';
            h += '<div style="display:flex;gap:6px">';
            var hideBtnText = a.isHidden ? '&#128065; إظهار' : '&#128123; إخفاء مؤقت';
            h += '<button class="bt bt-o" style="padding:4px 10px;font-size:11px" onclick="toggleAnnouncementVisibility(\''+d.id+'\', '+!!a.isHidden+')">'+hideBtnText+'</button>';
            h += '<button class="bt bt-d" style="padding:4px 10px;font-size:11px" onclick="deleteAnnouncement(\''+d.id+'\')">&#128465; حذف</button>';
            h += '</div></div></div>';
        });
        box.innerHTML = h;
    }).catch(function(err) {
        box.innerHTML = '<div class="empty-hint" style="color:var(--no)">&#10060; تعذر التحميل: '+err.message+'<br><small style="color:var(--tx3)">تأكد من نشر قواعد Firestore في Firebase Console</small></div>';
    });
}

function republishAnnouncement(id) {
    var a = window.loadedAnnouncements[id];
    if(!a) return;
    document.getElementById('annTitle').value = a.title || '';
    document.getElementById('annDate').value = a.date || '';
    document.getElementById('annContent').value = a.content || '';
    
    // Set audience radio
    var aud = a.audience === 'private' ? 'private' : 'all';
    var radios = document.getElementsByName('annAudience');
    for(var i=0; i<radios.length; i++) {
        if(radios[i].value === aud) radios[i].checked = true;
    }
    toggleAnnTargetWrap();
    
    // Set target employee if private
    if(aud === 'private' && a.targetUid) {
        var sel = document.getElementById('annTargetEmployee');
        if(sel) sel.value = a.targetUid;
    }
    
    // Scroll to top smooth
    var panel = document.getElementById('appContent');
    if (panel) {
        panel.scrollTo({top: 0, behavior: 'smooth'});
    } else {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }
}

function toggleAnnouncementVisibility(id, currentlyHidden) {
    db.collection('announcements').doc(id).update({
        isHidden: !currentlyHidden
    }).then(function() {
        loadAdminAnnouncements();
    }).catch(function(err) {
        alert('تعذر تغيير حالة الإعلان: ' + err.message);
    });
}

function toggleAnnouncementVisibility(id, currentlyHidden) {
    db.collection('announcements').doc(id).update({
        isHidden: !currentlyHidden
    }).then(function() {
        loadAdminAnnouncements();
    }).catch(function(err) {
        alert('تعذر تغيير حالة الإعلان: ' + err.message);
    });
}

function deleteAnnouncement(id) {
    if(!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    db.collection('announcements').doc(id).delete().then(loadAdminAnnouncements).catch(function(err){ alert('تعذر الحذف: '+err.message); });
}
function deleteAllAnnouncements() {
    if(!confirm('هل أنت متأكد من حذف جميع الإعلانات نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    var box = document.getElementById('annList');
    if(box) box.innerHTML = '<div class="empty-hint" style="color:var(--tx3)">&#9203; جارٍ حذف الكل...</div>';
    db.collection('announcements').get().then(function(snap) {
        var batch = db.batch();
        snap.forEach(function(d) { batch.delete(d.ref); });
        return batch.commit();
    }).then(function() {
        loadAdminAnnouncements();
    }).catch(function(err) {
        if(box) box.innerHTML = '<div class="empty-hint" style="color:var(--no)">&#10060; '+err.message+'</div>';
    });
}
function deleteAllSystemData() {
    var first = confirm('\u062A\u062D\u0630\u064A\u0631: \u0633\u064A\u062A\u0645 \u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0646\u0647\u0627\u0626\u064A\u0627\u064B. \u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F\u061F');
    if(!first) return;
    var second = confirm('\u062A\u0623\u0643\u064A\u062F \u0623\u062E\u064A\u0631: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0633\u062A\u0631\u062F\u0627\u062F \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0639\u062F \u0627\u0644\u062D\u0630\u0641. \u0647\u0644 \u062A\u0631\u064A\u062F \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629\u061F');
    if(!second) return;
    // ملحوظة: 'system' غير مدرجة عمداً — تحتوي فقط على system/meta (حالة الإعداد الأول)
    // وحذفها كان يفصّل حالة setupDone بشكل عشوائي حسب ترتيب تنفيذ الحذف، ويجبرك ترجع لصفحة setup.html.
    var collections = ['projects','tasks','announcements','requests','notifications','weeklyReports','achievements','chatMessages','projectComments','users','attendance_logs','employeeDocuments','formRequests'];
    // حساب الأدمن الحالي (اللي بيضغط على الزرار) يُستثنى دائماً من حذف مجموعة users
    // عشان ميتقفلش برّه النظام بعد الحذف بدون أي طريقة قانونية للرجوع (حساب Firebase Auth بيفضل موجود
    // لكن ملفه في Firestore كان بيتمسح، فيتحول لحساب معلّق مش قادر يدخل ولا يعمل setup تاني بنفس الإيميل).
    var myUid = (window.TG_USER && TG_USER.uid) || null;
    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1b2a4a;color:#fff;padding:14px 28px;border-radius:10px;z-index:99999;font-size:14px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    msg.textContent = '\u23F3 \u062C\u0627\u0631\u064D \u062D\u0630\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A...';
    document.body.appendChild(msg);
    var done = 0; var errors = [];
    collections.forEach(function(col) {
        db.collection(col).get().then(function(snap) {
            var batch = db.batch();
            snap.forEach(function(d) {
                if (col === 'users' && myUid && d.id === myUid) return; // احتفظ بحساب الأدمن الحالي
                batch.delete(d.ref);
            });
            return batch.commit();
        }).then(function() {
            done++;
            msg.textContent = '\u23F3 \u062C\u0627\u0631\u064D \u0627\u0644\u062D\u0630\u0641... ('+done+'/'+collections.length+')';
            if(done+errors.length === collections.length) {
                msg.style.background = '#1d7a4f';
                msg.textContent = '\u2705 \u062A\u0645 \u062D\u0630\u0641 \u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0646\u062C\u0627\u062D.';
                setTimeout(function(){ document.body.removeChild(msg); }, 3000);
            }
        }).catch(function(err) {
            errors.push(col+': '+err.message); done++;
            if(done+errors.length >= collections.length) {
                msg.style.background = '#c0392b';
                msg.textContent = '\u274C \u062A\u0639\u0630\u0631 \u062D\u0630\u0641 \u0628\u0639\u0636 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A.';
                setTimeout(function(){ document.body.removeChild(msg); }, 4000);
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// ─── صفحة تفاصيل المشروع للأدمن ──────────────────────────────
// ═══════════════════════════════════════════════════════════════
function openAdminProjectDetail(idx) {
    var p = (window._pmgmtProjectsCache || [])[idx];
    if (!p) return;
    window._activeProjDetailIdx = idx;
    var listView = document.getElementById('pmgmtListViewContainer');
    var detailView = document.getElementById('pmgmtDetailViewContainer');
    if (listView) listView.style.display = 'none';
    if (detailView) {
        detailView.style.display = 'block';
        var assignees = p.assignees || [];
        var sum = 0;
        assignees.forEach(function(uid){
            var pm = (p.progressMap && p.progressMap[uid]) ? p.progressMap[uid].progress : 0;
            sum += (pm || 0);
        });
        var avgProg = assignees.length ? Math.round(sum / assignees.length) : 0;
        var hasNotes = (p.comments && p.comments.length > 0);
        var over = isOverdue(p.deadline, p.status);
        var h = '<div class="emp-proj-detail">';
        h += '<button class="emp-proj-back" onclick="closeAdminProjectDetail()">🔙 العودة لقائمة المشاريع</button>';
        h += '<div class="emp-proj-detail-header">';
        h += '  <div class="emp-proj-detail-title">' + escH(p.title || 'بدون عنوان') + '</div>';
        if (p.description) h += '  <div class="emp-proj-detail-desc">' + escH(p.description) + '</div>';
        h += '  <div>' + projectTagsHtml(p) + '</div>';
        if (p.createdBy) h += '  <div style="font-size:10.5px;color:var(--tx3);margin-top:6px">أُنشئ بواسطة: <strong>' + escH(p.createdBy) + '</strong></div>';
        if(p.fileUrl){
            var fType = p.fileType || '';
            h += '<div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--bd,#ccd)">';
            if(fType.indexOf('image/')===0){
                h += '<a href="'+p.fileUrl+'" target="_blank"><img src="'+p.fileUrl+'" style="max-width:100%;max-height:200px;border-radius:6px;display:block"></a>';
            } else if(fType.indexOf('video/')===0){
                h += '<video src="'+p.fileUrl+'" controls style="max-width:100%;max-height:200px;border-radius:6px"></video>';
            } else {
                h += '<a href="'+p.fileUrl+'" target="_blank" style="color:var(--nv);font-weight:700;text-decoration:underline;display:inline-block">📎 '+escH(p.fileName||'ملف مرفق')+'</a>';
            }
            h += '</div>';
        }
        if(p.linkUrl){
            h += '<div style="margin-top:8px"><a href="'+escH(p.linkUrl)+'" target="_blank" style="color:var(--gd);font-weight:700;text-decoration:underline;font-size:13px">🔗 رابط خارجي للمشروع</a></div>';
        }
        h += '</div>';
        h += '<div class="proj-sec"><div class="proj-sec-title">👥 الموظفون المسؤولون عن المشروع</div>';
        if (assignees.length) {
            assignees.forEach(function(uid) {
                var e = PMGMT_EMPLOYEES.find(function(x) { return x.uid === uid; });
                var nm = e ? (e.name || e.email) : '(موظف غير موجود حالياً)';
                var pm = (p.progressMap && p.progressMap[uid]) || {progress:0, status:'لم يبدأ', note:''};
                h += '<div class="pj-row" style="background:var(--bg);padding:12px;border-radius:10px;margin-bottom:8px;">' +
                     '  <div style="display:flex;justify-content:space-between;font-weight:700;color:var(--tx);margin-bottom:4px;">' +
                     '    <span>' + escH(nm) + '</span>' +
                     '    <span style="color:var(--gd);margin-right:auto;">' + (pm.progress || 0) + '%</span>' +
                     '  </div>' +
                     '  <div class="pj-bar"><div class="pj-bar-in" style="width:' + (pm.progress || 0) + '%"></div></div>' +
                     '  <div class="pj-meta" style="margin-top:6px;">الحالة: <span class="badge ' + badgeClassForStatus(pm.status) + '">' + escH(pm.status || 'لم يبدأ') + '</span>' +
                     (pm.note ? (' · ملاحظة: ' + escH(pm.note)) : '') + '</div>' +
                     '</div>';
            });
        } else {
            h += '<div class="empty-hint">لم يتم تعيين أي موظف على هذا المشروع بعد.</div>';
        }
        h += '</div>';
        h += '<div class="proj-sec">' + projectChatHtml(p.id, 'pmChatLog' + idx, 'pmChatInput' + idx) + '</div>';
        h += '<div class="proj-sec"><div class="proj-sec-title">⚙️ إدارة المشروع</div>';
        h += '<div style="display:flex;gap:8px">' +
             '  <button class="bt bt-o" onclick="toggleProjEdit(' + idx + ')">✏️ تعديل المشروع</button>' +
             '  <button class="bt bt-d" onclick="deleteProject(\'' + p.id + '\')">🗑 حذف المشروع</button>' +
             '</div>';
        h += '<div id="pmEdit' + idx + '" style="display:none;margin-top:14px;padding-top:14px;border-top:1px dashed var(--bd2)">' +
             '  <div class="fg" style="margin-bottom:10px"><label>عنوان المشروع</label><input type="text" id="pmEditTitle' + idx + '" value="' + escH(p.title || '') + '"></div>' +
             '  <div class="fg fg-full" style="margin-bottom:10px"><label>وصف مختصر</label><textarea rows="2" id="pmEditDesc' + idx + '">' + escH(p.description || '') + '</textarea></div>' +
             '  <div class="fr fr3" style="margin-bottom:10px">' +
             '    <div class="fg"><label>الأولوية</label><select id="pmEditPriority' + idx + '">' +
                    ['منخفضة','متوسطة','عالية'].map(function(s){ return '<option' + ((p.priority || 'متوسطة') === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
             '    </select></div>' +
             '    <div class="fg"><label>حالة المشروع</label><select id="pmEditStatus' + idx + '">' +
                    ['مخطط له','جاري العمل','متوقف','مكتمل'].map(function(s){ return '<option' + ((p.status || 'مخطط له') === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
             '    </select></div>' +
             '    <div class="fg"><label>تاريخ الاستحقاق</label><input type="date" id="pmEditDeadline' + idx + '" value="' + escH(p.deadline || '') + '"></div>' +
             '  </div>' +
             '  <div class="fg fg-full" style="margin-bottom:6px"><label>الموظفون المسؤولون</label></div>' +
             '  <div class="chk-grid" id="pmEditAssignees' + idx + '">' + PMGMT_EMPLOYEES.map(function(e){
                  var checked = assignees.indexOf(e.uid) > -1 ? ' checked' : '';
                  return '<label><input type="checkbox" class="pm-edit-assignee-chk" ' + checked + ' value="' + e.uid + '"> ' + escH(e.name || e.email) + '</label>';
             }).join('') + '</div>' +
             '  <div style="display:flex;gap:8px;margin-top:10px">' +
             '    <button class="bt bt-p" onclick="saveProjectEdit(\'' + p.id + '\',' + idx + ')">💾 حفظ التعديلات</button>' +
             '    <button class="bt bt-o" onclick="toggleProjEdit(' + idx + ')">إلغاء</button>' +
             '  </div>' +
             '  <div id="pmEditMsg' + idx + '" style="margin-top:8px;font-size:11px"></div>' +
             '</div>';
        h += '</div>';
        h += '</div>';
        detailView.innerHTML = h;
        renderProjectChat(p.id, p.comments || [], 'pmChatLog' + idx);
    }
}

// ═══════════════════════════════════════════════════════════════
// ─── التقويم العام (FullCalendar) ───────────────────────────
// ═══════════════════════════════════════════════════════════════
function initGeneralCalendar() {
    var calendarEl = document.getElementById('generalCalendar');
    if (!calendarEl || !window.FullCalendar) {
        if(calendarEl) calendarEl.innerHTML = '<div class="empty-hint">⚠️ تعذر تحميل مكتبة التقويم. يرجى التحقق من الاتصال بالإنترنت.</div>';
        return;
    }
    
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ar',
        direction: 'rtl',
        firstDay: 6, // السبت
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        buttonText: {
            today: 'اليوم',
            month: 'شهر',
            week: 'أسبوع',
            day: 'يوم',
            list: 'أجندة'
        },
        noEventsText: 'لا توجد مواعيد تسليم في هذا الشهر',
        events: function(fetchInfo, successCallback, failureCallback) {
            Promise.all([
                db.collection('projects').get(),
                db.collection('tasks').get()
            ]).then(function(results) {
                var events = [];
                // المشاريع
                results[0].forEach(function(doc) {
                    var p = doc.data();
                    if (p.deadline) {
                        events.push({
                            id: 'proj-' + doc.id,
                            title: '📁 ' + p.title,
                            start: p.deadline,
                            backgroundColor: '#1b2a4a',
                            borderColor: '#1b2a4a',
                            textColor: '#ffffff',
                            extendedProps: { type: 'project' }
                        });
                    }
                });
                // المهام
                results[1].forEach(function(doc) {
                    var t = doc.data();
                    if (t.deadline) {
                        events.push({
                            id: 'task-' + doc.id,
                            title: '🗂 ' + t.title,
                            start: t.deadline,
                            backgroundColor: '#27ae60',
                            borderColor: '#27ae60',
                            textColor: '#ffffff',
                            extendedProps: { type: 'task' }
                        });
                    }
                });
                successCallback(events);
            }).catch(function(err) {
                console.error('Calendar error:', err);
                failureCallback(err);
            });
        },
        eventClick: function(info) {
            var type = info.event.extendedProps.type;
            if (type === 'project') go('pmgmt');
            else if (type === 'task') go('tasksmgmt');
        }
    });
    
    setTimeout(function() {
        calendar.render();
    }, 50);
}

function closeAdminProjectDetail() {
    window._activeProjDetailIdx = null;
    var listView = document.getElementById('pmgmtListViewContainer');
    var detailView = document.getElementById('pmgmtDetailViewContainer');
    if (listView) listView.style.display = 'block';
    if (detailView) detailView.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
// ─── صفحة تفاصيل الموظف للأدمن ───────────────────────────────
// ═══════════════════════════════════════════════════════════════
function openAdminEmployeeDetail(idx) {
    var emp = (window._staffEmpCache || [])[idx];
    if (!emp) return;
    window._activeStaffDetailIdx = idx;
    var listView = document.getElementById('staffListViewContainer');
    var detailView = document.getElementById('staffDetailViewContainer');
    if (listView) listView.style.display = 'none';
    if (detailView) {
        detailView.style.display = 'block';
        var pending = emp.requests.filter(function(r){return r.status==='pending';}).length;
        var avgProg = emp.projects.length ? Math.round(emp.projects.reduce(function(s,p){
            var pm = (p.progressMap && p.progressMap[emp.uid]) ? p.progressMap[emp.uid].progress : 0;
            return s + (pm || 0);
        }, 0) / emp.projects.length) : 0;
        var h = '<div class="emp-proj-detail">';
        h += '<button class="emp-proj-back" onclick="closeAdminEmployeeDetail()">🔙 العودة لقائمة الموظفين</button>';
        h += '<div class="emp-proj-detail-header">';
        h += '  <div class="emp-proj-detail-title">' + escH(emp.name || emp.email);
        if (emp.jobTitle) h += ' <span class="badge" style="background:var(--gd);color:#1b2a4a">' + escH(emp.jobTitle) + '</span>';
        h += (emp.disabled ? ' <span class="badge badge-disabled">🚫 معطّل</span>' : ' <span class="badge badge-active">✅ نشط</span>');
        h += '  </div>';
        h += '  <div class="emp-proj-detail-desc">' + escH(emp.email || '') + (emp.employeeCode ? ' · كود: <strong>' + escH(emp.employeeCode) + '</strong>' : '') + '</div>';
        h += '</div>';
        h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">';
        h += '  <button class="bt bt-o" onclick="toggleEmpNameEdit(' + idx + ')">✏️ تعديل الاسم</button>';
        h += '  <button class="bt bt-o" onclick="toggleEmpJobEdit(' + idx + ')">🏷 تعديل المسمى</button>';
        h += '  <button class="bt bt-o" onclick="toggleEmpWorkMode(' + idx + ')">🏢 نظام العمل (' + (emp.workMode === 'remote' ? 'ريموتلي' : 'مكتب') + ')</button>';
        h += '  <button class="bt ' + (emp.disabled ? 'bt-p' : 'bt-o') + '" onclick="toggleEmpDisabled(\'' + emp.uid + '\',' + (!!emp.disabled) + ')">' + (emp.disabled ? '✅ تفعيل الحساب' : '🚫 تعطيل الحساب') + '</button>';
        h += '  <button class="bt bt-d" onclick="openDeleteEmpModal(\'' + emp.uid + '\',' + idx + ')">🗑 حذف الموظف</button>';
        h += '  <button class="bt bt-o" style="background:linear-gradient(135deg,#1b2a4a,#2980b9);color:#fff;border:0" onclick="printEmployeeWorkReport(' + idx + ')">🖨 طباعة تقرير الشغل</button>';
        h += '</div>';
        h += '<div class="emp-inline-edit" id="empNameEdit' + idx + '" style="display:none">' +
             '  <input type="text" id="empNameInput\' + idx + \'" value="\' + escH(emp.baseName||emp.name|| \'\') + \'">' +
             '  <button class="bt bt-p" onclick="saveEmpName(\'' + emp.uid + '\',' + idx + ')">💾 حفظ</button>' +
             '  <span id="empNameMsg' + idx + '" style="font-size:10.5px"></span>' +
             '</div>';
        h += '<div class="emp-inline-edit" id="empJobEdit' + idx + '" style="display:none">' +
             '  <input type="text" id="empJobInput' + idx + '" value="' + escH(emp.jobTitle || '') + '" placeholder="مثلاً: مصمم جرافيك">' +
             '  <button class="bt bt-p" onclick="saveEmpJob(\'' + emp.uid + '\',' + idx + ')">💾 حفظ</button>' +
             '  <span id="empJobMsg' + idx + '" style="font-size:10.5px"></span>' +
             '</div>';
        h += '<div class="emp-inline-edit" id="empWorkModeEdit' + idx + '" style="display:none">' +
             '  <select id="empWorkModeInput' + idx + '"><option value="office" '+(emp.workMode !== 'remote' ? 'selected' : '')+'>من المكتب</option><option value="remote" '+(emp.workMode === 'remote' ? 'selected' : '')+'>عن بُعد (ريموتلي)</option></select>' +
             '  <button class="bt bt-p" onclick="saveEmpWorkMode(\'' + emp.uid + '\',' + idx + ')">💾 حفظ</button>' +
             '  <span id="empWorkModeMsg' + idx + '" style="font-size:10.5px"></span>' +
             '</div>';
        h += '<div class="proj-sec"><div class="proj-sec-title">📁 المشاريع المُسندة (' + emp.projects.length + ')</div>';
        if (emp.projects.length) {
            emp.projects.forEach(function(p) {
                var pm = (p.progressMap && p.progressMap[emp.uid]) || {progress:0, status:'لم يبدأ', note:''};
                h += '<div class="pj-row" style="background:var(--bg);padding:12px;border-radius:10px;margin-bottom:8px;">' +
                     '  <div style="display:flex;justify-content:space-between;font-weight:700;color:var(--tx);margin-bottom:4px;">' +
                     '    <span>' + escH(p.title || 'بدون عنوان') + '</span>' +
                     '    <span style="color:var(--gd);">' + (pm.progress || 0) + '%</span>' +
                     '  </div>' +
                     '  <div class="pj-bar"><div class="pj-bar-in" style="width:' + (pm.progress || 0) + '%"></div></div>' +
                     '  <div class="pj-meta" style="margin-top:6px;">الحالة: <span class="badge ' + badgeClassForStatus(pm.status) + '">' + escH(pm.status || 'لم يبدأ') + '</span>' +
                     (pm.note ? (' · ملاحظة: ' + escH(pm.note)) : '') + '</div>' +
                     '</div>';
            });
        } else {
            h += '<div class="empty-hint">لا توجد مشاريع مُسندة حالياً.</div>';
        }
        h += '</div>';
        if(emp.role !== 'tech_admin'){
            h += '<div class="proj-sec"><div class="proj-sec-title">📨 الطلبات (' + emp.requests.length + ')</div>';
            if (emp.requests.length) {
                emp.requests.forEach(function(r) {
                    h += '<div class="rq-row" style="background:var(--bg);padding:12px;border-radius:10px;margin-bottom:8px;">' +
                         '  <div class="rq-t" style="font-weight:700;">' + escH(r.type || 'طلب') + ' <span class="badge ' + badgeClassForReq(r.status) + '">' + reqStatusLabel(r.status) + '</span></div>' +
                         (r.details ? ('  <div class="pj-meta" style="margin-top:4px;">' + escH(r.details) + '</div>') : '') +
                         (function(){
                             if(!r.dynamicData) return '';
                             var dh = '<div style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.04);border-radius:6px;font-size:11px;">';
                             var tpl = window.FS_TEMPLATES && r.formTemplateId ? window.FS_TEMPLATES[r.formTemplateId] : null;
                             var fieldLabels = {};
                             if(tpl && tpl.fields) { tpl.fields.forEach(function(f){ fieldLabels[f.id] = f.label; }); }
                             for(var k in r.dynamicData){
                                 var v = r.dynamicData[k];
                                 if(v === true) v = 'نعم / تم';
                                 if(v === false) v = 'لا';
                                 var lbl = fieldLabels[k] || k;
                                 if(lbl === 'chk1') lbl = 'تسليم العهدة المالية';
                                 if(lbl === 'chk2') lbl = 'تسليم العهدة العينية';
                                 if(lbl === 'chk3') lbl = 'تسليم المستندات والملفات';
                                 if(lbl === 'chk4') lbl = 'إنهاء المهام المعلقة';
                                 dh += '<div style="margin-bottom:3px;"><span style="color:var(--tx3);display:inline-block;width:100px;">' + escH(lbl) + ':</span> <b style="white-space:pre-wrap;">' + escH(v) + '</b></div>';
                             }
                             dh += '</div>';
                             return dh;
                         })() +
                         (r.status === 'pending' ? ('  <div class="rq-actions" style="margin-top:8px"><button class="bt bt-p" onclick="reviewRequest(\'' + r.id + '\',\'approved\')">✔ موافقة</button><button class="bt bt-d" onclick="reviewRequest(\'' + r.id + '\',\'rejected\')">✕ رفض</button></div>') : '') +
                         '</div>';
                });
            } else {
                h += '<div class="empty-hint">لا توجد طلبات بعد.</div>';
            }
            h += '</div>';
        }
        h += '</div>';
        detailView.innerHTML = h;
    }
}

function closeAdminEmployeeDetail() {
    window._activeStaffDetailIdx = null;
    var listView = document.getElementById('staffListViewContainer');
    var detailView = document.getElementById('staffDetailViewContainer');
    if (listView) listView.style.display = 'block';
    if (detailView) detailView.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
// ─── طباعة تقرير شغل الموظف (مشاريع + مهام + حالاتهم) ────────
// ═══════════════════════════════════════════════════════════════
function printEmployeeWorkReport(empIdx) {
    var emp = (window._staffEmpCache || [])[empIdx];
    if (!emp) return;
    var today = new Date().toLocaleDateString('ar-EG', {year:'numeric',month:'long',day:'numeric'});
    var overallAvg = emp.projects.length ? Math.round(emp.projects.reduce(function(s,p){
        var pm = (p.progressMap && p.progressMap[emp.uid]) ? p.progressMap[emp.uid].progress : 0;
        return s + (pm || 0);
    }, 0) / emp.projects.length) : 0;
    var projRows = '';
    emp.projects.forEach(function(p) {
        var pm = (p.progressMap && p.progressMap[emp.uid]) || {progress:0, status:'لم يبدأ', note:''};
        var statusColor = pm.status==='مكتمل'?'#27ae60':pm.status==='جاري العمل'?'#2980b9':'#7f8c8d';
        projRows += '<tr>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:700">' + escH(p.title||'—') + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #eee;color:#888">' + escH(p.description||'—') + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center"><span style="background:' + statusColor + ';color:#fff;border-radius:20px;padding:2px 10px;font-size:11px">' + escH(pm.status||'لم يبدأ') + '</span></td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;font-weight:800;color:#c9a227">' + (pm.progress||0) + '%</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:11px;color:#888">' + escH(pm.note||'—') + '</td>' +
            '<td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center">' + escH(p.deadline||'—') + '</td>' +
            '</tr>';
    });
    db.collection('tasks').where('assignedTo','==',emp.uid).get().then(function(snap) {
        var tasks = snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});
        tasks.sort(function(a,b){
            var am=(a.createdAt&&a.createdAt.toMillis)?a.createdAt.toMillis():0;
            var bm=(b.createdAt&&b.createdAt.toMillis)?b.createdAt.toMillis():0;
            return bm-am;
        });
        var taskRows = '';
        tasks.forEach(function(t) {
            var sc = t.status==='مكتمل'?'#27ae60':t.status==='جاري العمل'?'#2980b9':'#7f8c8d';
            var pc = t.priority==='عالية'?'#e74c3c':t.priority==='متوسطة'?'#f39c12':'#95a5a6';
            taskRows += '<tr>' +
                '<td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:700">' + escH(t.title||'—') + '</td>' +
                '<td style="padding:8px 10px;border-bottom:1px solid #eee;color:#888">' + escH(t.description||'—') + '</td>' +
                '<td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center"><span style="background:'+pc+';color:#fff;border-radius:20px;padding:2px 10px;font-size:11px">' + escH(t.priority||'—') + '</span></td>' +
                '<td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center"><span style="background:'+sc+';color:#fff;border-radius:20px;padding:2px 10px;font-size:11px">' + escH(t.status||'لم يبدأ') + '</span></td>' +
                '<td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center">' + escH(t.deadline||'—') + '</td>' +
                '</tr>';
        });
        var win = window.open('','_blank');
        win.document.write('<html dir="rtl"><head><title>تقرير شغل - '+escH(emp.name||emp.email)+'</title>' +
            '<style>@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap");' +
            'body{font-family:"Cairo",sans-serif;padding:40px;color:#1b2a4a;max-width:900px;margin:auto}' +
            '.header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #c9a227}' +
            '.header h1{font-size:22px;margin:0 0 4px}' +
            '.header h2{font-size:14px;color:#888;margin:0}' +
            '.stats{display:flex;gap:16px;justify-content:center;margin:20px 0}' +
            '.stat-card{background:linear-gradient(135deg,#1b2a4a,#2c3e6b);color:#fff;border-radius:12px;padding:14px 24px;text-align:center;min-width:80px}' +
            '.stat-num{font-size:24px;font-weight:900}.stat-lbl{font-size:11px;opacity:.8}' +
            '.section{margin-top:24px}' +
            '.sec-title{font-weight:900;font-size:14px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #c9a227}' +
            'table{width:100%;border-collapse:collapse;margin-top:8px}' +
            'th{background:#1b2a4a;color:#fff;padding:10px;font-size:11px;text-align:right}' +
            '.footer{margin-top:40px;text-align:center;font-size:11px;color:#aaa;border-top:2px solid #eee;padding-top:16px}' +
            '@media print{body{padding:20px}}</style></head><body>' +
            '<div class="header"><h1>تقرير أداء وشغل الموظف</h1><h2>' + escH(emp.name||emp.email) + (emp.jobTitle ? ' — '+escH(emp.jobTitle) : '') + '</h2><div style="font-size:12px;color:#aaa;margin-top:6px">'+today+'</div>' +
            '<div style="background:linear-gradient(135deg,#c9a227,#e8c547);color:#1b2a4a;border-radius:8px;padding:4px 12px;margin-top:6px;font-size:13px;font-weight:800;display:inline-block">'+overallAvg+'% متوسط الإنجاز</div>' +
            '</div>' +
            '<div class="stats">' +
            '<div class="stat-card"><div class="stat-num">'+emp.projects.length+'</div><div class="stat-lbl">مشروع</div></div>' +
            '<div class="stat-card"><div class="stat-num">'+tasks.length+'</div><div class="stat-lbl">مهمة</div></div>' +
            '<div class="stat-card"><div class="stat-num">'+emp.achievements.length+'</div><div class="stat-lbl">إنجاز</div></div>' +
            '</div>' +
            (emp.projects.length ?
                '<div class="section"><div class="sec-title">📁 المشاريع المُسندة وحالة الإنجاز</div>' +
                '<table><thead><tr><th>اسم المشروع</th><th>الوصف</th><th>الحالة</th><th>التقدم</th><th>ملاحظة</th><th>تاريخ الاستحقاق</th></tr></thead>' +
                '<tbody>'+projRows+'</tbody></table></div>':
                '<div class="section"><div class="sec-title">📁 المشاريع</div><p style="color:#aaa;text-align:center;padding:20px">لا توجد مشاريع مُسندة</p></div>')+
            (tasks.length ?
                '<div class="section"><div class="sec-title">📋 المهام الموكّلة</div>' +
                '<table><thead><tr><th>عنوان المهمة</th><th>الوصف</th><th>الأولوية</th><th>الحالة</th><th>تاريخ التسليم</th></tr></thead>' +
                '<tbody>'+taskRows+'</tbody></table></div>':
                '<div class="section"><div class="sec-title">📋 المهام</div><p style="color:#aaa;text-align:center;padding:20px">لا توجد مهام موكّلة</p></div>')+
            '<div class="footer">تقرير آلي صادر من نظام Tech Go — '+today+'</div>' +
            '</body></html>');
        win.document.close();
        setTimeout(function(){ win.print(); }, 600);
    });
}

window.calcSalRec = function() {
    var basic = parseFloat((document.getElementById('sr_basic') && document.getElementById('sr_basic').value) || 0);
    var allow = parseFloat((document.getElementById('sr_allow') && document.getElementById('sr_allow').value) || 0);
    var bonus = parseFloat((document.getElementById('sr_bonus') && document.getElementById('sr_bonus').value) || 0);
    var deduct = parseFloat((document.getElementById('sr_deduct') && document.getElementById('sr_deduct').value) || 0);
    
    var gross = basic + allow + bonus;
    var net = gross - deduct;
    
    var grossEl = document.getElementById('sr_gross');
    var netEl = document.getElementById('sr_net');
    
    if (grossEl) grossEl.value = gross ? gross.toFixed(2) : '0.00';
    if (netEl) netEl.value = net ? net.toFixed(2) : '0.00';
};

// ═══════════════════════════════════════════════════════════════
// ─── كود وظيفي فريد (لا يتكرر) ──────────────────────────────
// ═══════════════════════════════════════════════════════════════
function generateUniqueEmpCode(name) {
    var prefix = 'TG';
    var namePart = (name || '').replace(/\s+/g,'').toUpperCase().substring(0,3) || 'EMP';
    namePart = namePart.replace(/[^\x00-\x7F]/g, function(c){ return String(c.charCodeAt(0)%9+1); });
    var num = String(Math.floor(Math.random()*9000)+1000);
    return prefix + '-' + namePart + num;
}
function ensureEmployeeCode(uid, name, callback) {
    db.collection('users').doc(uid).get().then(function(doc) {
        if (!doc.exists) { if(callback) callback(null); return; }
        var data = doc.data();
        if (data.employeeCode) { if(callback) callback(data.employeeCode); return; }
        function tryCode() {
            var code = generateUniqueEmpCode(name);
            db.collection('users').where('employeeCode','==',code).get().then(function(snap){
                if (snap.empty) {
                    db.collection('users').doc(uid).update({ employeeCode: code }).then(function(){
                        if(callback) callback(code);
                    });
                } else {
                    tryCode();
                }
            });
        }
        tryCode();
    });
}

// ═══════════════════════════════════════════════════════════════
// ─── ربط الشيتات بحسابات الموظفين (autofill) ─────────────────
// ═══════════════════════════════════════════════════════════════
function autofillEmployeeFields() {
    if (!TG_USER) return;
    var name = TG_USER.name || '';
    var email = TG_USER.email || '';
    var jobTitle = TG_USER.jobTitle || '';
    var code = TG_USER.employeeCode || '';
    document.querySelectorAll('.emp-name-fld:not([data-autofilled])').forEach(function(f) {
        if (!f.value) { f.value = name; f.setAttribute('data-autofilled','1'); }
    });
    document.querySelectorAll('.emp-code-fld:not([data-autofilled])').forEach(function(f) {
        if (!f.value && code) { f.value = code; f.setAttribute('data-autofilled','1'); }
    });
    document.querySelectorAll('.emp-job-fld:not([data-autofilled])').forEach(function(f) {
        if (!f.value && jobTitle) { f.value = jobTitle; f.setAttribute('data-autofilled','1'); }
    });
    document.querySelectorAll('.emp-email-fld:not([data-autofilled])').forEach(function(f) {
        if (!f.value && email) { f.value = email; f.setAttribute('data-autofilled','1'); }
    });
}

// ─── خطاف تبديل الصفحات لتشغيل autofill والتحقق من الكود ─────
function onPageChange(id) {
    setTimeout(function() {
        autofillEmployeeFields();
        if(typeof populateDraftsSidebar === 'function') populateDraftsSidebar(id);
        if (TG_USER && TG_USER.uid && !TG_USER.employeeCode && TG_USER.role === 'employee') {
            ensureEmployeeCode(TG_USER.uid, TG_USER.name, function(code) {
                if (code) {
                    TG_USER.employeeCode = code;
                    autofillEmployeeFields();
                }
            });
        }
    }, 150);
}
document.addEventListener('DOMContentLoaded', function(){
    setTimeout(autofillEmployeeFields, 800);
    document.addEventListener('input', function(e) {
        if (!e.target.closest('#pg-emp')) return;
        var lbl = e.target.previousElementSibling ? e.target.previousElementSibling.textContent.trim() : "";
        if (lbl === "الاسم الكامل" || lbl === "اسم الموظف") {
            document.querySelectorAll('#pg-emp input').forEach(function(inp) {
                var l = inp.previousElementSibling ? inp.previousElementSibling.textContent.trim() : "";
                if ((l === "الاسم الكامل" || l === "اسم الموظف") && inp !== e.target) inp.value = e.target.value;
            });
        } else if (lbl === "السنة") {
            document.querySelectorAll('#pg-emp input').forEach(function(inp) {
                var l = inp.previousElementSibling ? inp.previousElementSibling.textContent.trim() : "";
                if (l === "السنة" && inp !== e.target) inp.value = e.target.value;
            });
        }
    });
});


// ── الإعلانات (Announcements) ──────────────────────────────────────
function addAnnouncement() {
    var title = (document.getElementById('annTitle').value||'').trim();
    var date = (document.getElementById('annDate').value||'').trim();
    var content = (document.getElementById('annContent').value||'').trim();
    var msg = document.getElementById('annMsg');
    var audienceEl = document.querySelector('input[name="annAudience"]:checked');
    var audience = audienceEl ? audienceEl.value : 'all';
    var targetUid = '', targetName = '';

    if(audience === 'private') {
        var targetSel = document.getElementById('annTargetEmployee');
        targetUid = targetSel ? targetSel.value : '';
        targetName = (targetSel && targetSel.selectedOptions && targetSel.selectedOptions[0]) ? targetSel.selectedOptions[0].textContent : '';
        if(!targetUid) { msg.style.color = 'var(--no)'; msg.textContent = 'اختر الموظف المرسل إليه الإعلان الخاص.'; return; }
    }

    if(!title || !content) { msg.style.color = 'var(--no)'; msg.textContent = 'عنوان ومحتوى الإعلان مطلوبان.'; return; }
    
    msg.style.color = 'var(--tx3)'; msg.textContent = '⏳ جارٍ النشر...';
    
    var createdByRole = (TG_USER && TG_USER.role === 'tech_admin') ? 'أدمن تقني' : 'أدمن إداري';
    try {
        var annData = {
            title: title,
            date: date,
            content: content,
            audience: audience,
            createdAt: new Date(),
            createdBy: TG_USER ? (TG_USER.name || TG_USER.email || 'الإدارة') : 'الإدارة',
            createdByRole: createdByRole
        };
        if(audience === 'private') {
            annData.targetUid = targetUid;
            annData.targetName = targetName;
        }
        db.collection('announcements').add(annData).then(function() {
            msg.style.color = 'var(--ok)'; msg.textContent = '✅ تم نشر الإعلان.';
            document.getElementById('annTitle').value = '';
            document.getElementById('annDate').value = '';
            document.getElementById('annContent').value = '';
            setTimeout(function(){ msg.textContent = ''; }, 3000);
            loadAdminAnnouncements();
            // إرسال إشعار — للجميع لو عام (tgBroadcastPush)، أو للموظف المستهدف فقط لو خاص (tgSendPushToUser)
            var preview = content.length > 70 ? content.slice(0, 70) + '…' : content;
            if(audience === 'private') {
                if (typeof tgSendPushToUser === 'function') {
                    tgSendPushToUser(targetUid, '📩 إعلان خاص: ' + title, preview, 'announcement-new');
                }
            } else {
                if (typeof tgBroadcastPush === 'function') {
                    tgBroadcastPush('📢 إعلان جديد: ' + title, preview, 'announcement-new', TG_USER ? TG_USER.uid : '');
                }
            }
        }).catch(function(err) {
            msg.style.color = 'var(--no)'; msg.textContent = '❌ ' + err.message;
        });
    } catch(syncErr) {
        console.error("Sync Error in addAnnouncement:", syncErr);
        msg.style.color = 'var(--no)'; msg.textContent = '❌ خطأ تقني: ' + syncErr.message;
        if(typeof tgToast === 'function') tgToast('❌ خطأ تقني: ' + syncErr.message, 'err');
    }
}

// Loads announcements in employee dashboard — مقسّمة لقسمين: عام + خاص بالموظف الحالي
function loadEmpAnnouncements() {
    var box = document.getElementById('empAnnouncementsList');
    var panel = document.getElementById('empAnnouncementsPanel');
    if(!box || !panel) return;
    var myUid = TG_USER ? TG_USER.uid : '';

    function annCard(data, isPrivate) {
        var borderColor = isPrivate ? 'var(--gd)' : 'var(--nv)';
        var h = '<div style="background:rgba(255,255,255,.1);padding:14px 18px;border-radius:10px;border-right:4px solid '+borderColor+';margin-bottom:8px">';
        h += '<div style="font-size:15px;font-weight:800;margin-bottom:6px">'+esc(data.title)+'</div>';
        h += '<div style="font-size:13px;opacity:.9;line-height:1.6">'+esc(data.content)+'</div>';
        if(data.createdBy) h += '<div style="font-size:11px;opacity:.75;margin-top:8px">👤 '+esc(data.createdBy)+(data.createdByRole?' <span style="opacity:.8">('+esc(data.createdByRole)+')</span>':'')+'</div>';
        if(data.date) h += '<div style="font-size:11px;opacity:.6;margin-top:4px">📅 '+esc(data.date)+'</div>';
        h += '</div>';
        return h;
    }

    // نجيب أحدث 30 إعلان ونقسمهم على العميل — بيغطي الإعلانات القديمة اللي مفيهاش حقل audience (بتتعامل كـ "عام")
    db.collection('announcements').orderBy('createdAt', 'desc').limit(30).onSnapshot(function(snap) {
        if(snap.empty) {
            panel.style.display = 'none';
            return;
        }
        var publicOnes = [];
        var privateOnes = [];
        snap.forEach(function(d) {
            var data = d.data();
            if(data.isHidden) return;
            if(data.audience === 'private') {
                if(data.targetUid === myUid) privateOnes.push(data);
            } else {
                publicOnes.push(data);
            }
        });
        publicOnes = publicOnes.slice(0, 5);
        privateOnes = privateOnes.slice(0, 5);

        if(!publicOnes.length && !privateOnes.length) {
            panel.style.display = 'none';
            return;
        }
        panel.style.display = 'block';

        var h = '';
        if(privateOnes.length) {
            h += '<div style="font-size:13px;font-weight:800;margin:0 0 8px;opacity:.9">👤 إعلانات خاصة بيك</div>';
            privateOnes.forEach(function(data){ h += annCard(data, true); });
        }
        if(publicOnes.length) {
            if(privateOnes.length) h += '<div style="font-size:13px;font-weight:800;margin:14px 0 8px;opacity:.9">📢 إعلانات عامة</div>';
            publicOnes.forEach(function(data){ h += annCard(data, false); });
        }
        box.innerHTML = h;
    });
}

// ═══════════════════════════════════════════════════════════════
// ── ملفات الموظفين (المستندات الرقمية) ─────────────────────────
function loadEmpDocsOverview() {
    var box = document.getElementById('empDocsList');
    if(!box) return;
    db.collection('users').where('role','in',['employee','tech_admin']).get().then(function(snap){
        if(snap.empty){
            box.innerHTML = '<div class="empty-hint">لا يوجد موظفون مسجّلون بعد.</div>';
            return;
        }
        var employees = [];
        snap.forEach(function(doc){ employees.push(Object.assign({uid:doc.id},doc.data())); });
        window._empDocsCache = employees;
        renderEmpDocsList(employees);
    }).catch(function(err){
        box.innerHTML = '<div class="empty-hint" style="color:var(--no)">تعذر تحميل قائمة الموظفين: '+escH(err.message)+'</div>';
    });
}

function renderEmpDocsList(list) {
    var box = document.getElementById('empDocsList');
    if(!box) return;
    var h = '';
    list.forEach(function(emp, idx) {
        var searchKey = ((emp.name||'')+' '+(emp.email||'')).toLowerCase();
        h += '<div class="staff-card" data-search="'+escH(searchKey)+'" id="empDocCard_'+idx+'">';
        h += '<div class="staff-card-h" onclick="toggleEmpDocCard('+idx+', \''+emp.uid+'\')">';
        h += '<div><div class="staff-name-row"><span class="staff-name">'+escH(emp.name||emp.email)+'</span>'+
             (emp.jobTitle?'<span class="badge" style="background:var(--gd);color:#1b2a4a">'+escH(emp.jobTitle)+'</span>':'')+'</div>';
        h += '<div class="staff-email">'+escH(emp.email||'')+'</div></div>';
        h += '<div class="staff-stats"><span class="bt bt-o" style="pointer-events:none">📂 فتح الملف الرقمي</span></div>';
        h += '</div>';
        h += '<div class="staff-card-body" id="empDocBody_'+idx+'" style="display:none">';
        h += '<div class="form-grid" style="background:rgba(255,255,255,.05);padding:16px;border-radius:10px;margin-bottom:16px">';
        h += '<div class="fg"><label>اسم المستند (مثال: عقد العمل)</label><input type="text" id="newDocTitle_'+idx+'"></div>';
        h += '<div class="fg"><label>ملف المستند</label><input type="file" id="newDocFile_'+idx+'"></div>';
        h += '<div class="fg" style="display:flex;align-items:flex-end"><button class="bt bt-p" style="width:100%" onclick="uploadEmpDoc(\''+emp.uid+'\', '+idx+')">⬆ رفع المستند</button></div>';
        h += '</div><div id="docUploadMsg_'+idx+'" style="font-size:12px;margin-bottom:12px"></div>';
        h += '<h4 style="margin-bottom:8px">📄 المستندات المحفوظة</h4>';
        h += '<div id="empDocsFolderList_'+idx+'"><div class="empty-hint">اضغط لعرض المستندات.</div></div>';
        h += '</div></div>';
    });
    box.innerHTML = h;
}

function filterEmpDocsList(val) {
    var v = val.toLowerCase().trim();
    var cards = document.querySelectorAll('#empDocsList .staff-card');
    cards.forEach(function(c){
        if(c.getAttribute('data-search').indexOf(v) > -1) c.style.display = 'block';
        else c.style.display = 'none';
    });
}

window._empDocsListeners = window._empDocsListeners || {};

function toggleEmpDocCard(idx, uid) {
    var body = document.getElementById('empDocBody_'+idx);
    var card = document.getElementById('empDocCard_'+idx);
    if(body.style.display === 'none') {
        body.style.display = 'block';
        card.classList.add('open');
        var box = document.getElementById('empDocsFolderList_'+idx);
        box.innerHTML = '<div class="empty-hint">⏳ جارٍ التحميل...</div>';
        if(window._empDocsListeners[uid]) { window._empDocsListeners[uid](); }
        window._empDocsListeners[uid] = db.collection('employeeDocuments').where('uid','==',uid).onSnapshot(function(snap){
            var b = document.getElementById('empDocsFolderList_'+idx);
            if(!b) return;
            if(snap.empty){
                b.innerHTML = '<div class="empty-hint">لا توجد مستندات مرفوعة لهذا الموظف.</div>';
                return;
            }
            var docs = [];
            snap.forEach(function(d){ docs.push(d); });
            docs.sort(function(a,b){
                var ta = a.data().createdAt ? a.data().createdAt.toMillis() : 0;
                var tb = b.data().createdAt ? b.data().createdAt.toMillis() : 0;
                return tb - ta;
            });
            var h = '<div style="display:flex;flex-direction:column;gap:8px">';
            docs.forEach(function(doc){
                var d = doc.data();
                var directBadge = d.isDirectToAdmin ? '<span class="badge" style="background:var(--gd);color:var(--nv);font-size:9px;margin-right:6px">📩 مرسل للأدمن مباشرة</span>' : '';
                h += '<div style="background:rgba(0,0,0,.3);padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;border-right:3px solid var(--gd)">';
                h += '<div><div style="font-weight:bold;margin-bottom:4px">'+escH(d.title)+' '+directBadge+'</div>';
                h += '<div style="font-size:11px;opacity:.6">بواسطة: '+(d.uploadedBy==='admin'?'الإدارة':(d.isDirectToAdmin?'الموظف (إرسال مباشر)':'الموظف نفسه'))+' · '+(d.createdAt&&d.createdAt.toDate?d.createdAt.toDate().toLocaleString('ar-EG'):'')+'</div></div>';
                h += '<div style="display:flex;gap:8px"><a href="'+d.fileUrl+'" target="_blank" class="bt bt-p" style="padding:4px 10px;font-size:11px;text-decoration:none">👁 عرض</a>';
                h += '<button class="bt bt-d" style="padding:4px 10px;font-size:11px" onclick="deleteEmpDoc(\''+doc.id+'\', \''+d.fileUrl+'\')">🗑 حذف</button></div>';
                h += '</div>';
            });
            h += '</div>';
            b.innerHTML = h;
        }, function(err){
            var b = document.getElementById('empDocsFolderList_'+idx);
            if(b) b.innerHTML = '<div class="empty-hint" style="color:var(--no)">خطأ في تحميل المستندات: '+escH(err.message)+'</div>';
        });
    } else {
        body.style.display = 'none';
        card.classList.remove('open');
        if(window._empDocsListeners[uid]) {
            window._empDocsListeners[uid]();
            delete window._empDocsListeners[uid];
        }
    }
}

function uploadEmpDoc(uid, idx) {
    var titleInp = document.getElementById('newDocTitle_'+idx);
    var fileInp = document.getElementById('newDocFile_'+idx);
    var msg = document.getElementById('docUploadMsg_'+idx);
    var title = (titleInp.value||'').trim();
    if(!title){ msg.style.color='var(--no)'; msg.textContent='❌ يرجى كتابة اسم المستند.'; return; }
    if(!fileInp.files || fileInp.files.length===0){ msg.style.color='var(--no)'; msg.textContent='❌ يرجى اختيار ملف.'; return; }
    
    var file = fileInp.files[0];
    msg.style.color = '#fff'; msg.textContent = '⏳ جارٍ الرفع... يرجى الانتظار';
    tgUploadFile('employeeDocuments/'+uid, file.name, file, null, function(err){
        msg.style.color = 'var(--no)'; msg.textContent = '❌ تعذر رفع الملف: '+err;
    }, function(url) {
        db.collection('employeeDocuments').add({
            uid: uid,
            title: title,
            fileName: file.name,
            fileType: file.type,
            fileUrl: url,
            uploadedBy: 'admin',
            createdAt: new Date()
        }).then(function(){
            titleInp.value = '';
            fileInp.value = '';
            msg.style.color = 'var(--ok)'; msg.textContent = '✅ تم رفع المستند بنجاح.';
            setTimeout(function(){ msg.textContent=''; }, 3000);
        }).catch(function(err){
            msg.style.color = 'var(--no)'; msg.textContent = '❌ تعذر حفظ بيانات المستند: '+err.message;
        });
    });
}

function deleteEmpDoc(docId, fileUrl) {
    if(!confirm('هل أنت متأكد من حذف هذا المستند نهائياً؟')) return;
    db.collection('employeeDocuments').doc(docId).delete().then(function(){
        if(fileUrl && typeof tgDeleteSupabaseFile === 'function') {
            tgDeleteSupabaseFile(fileUrl);
        }
    }).catch(function(err){
        alert('❌ خطأ أثناء الحذف: '+err.message);
    });
}

// ═══════════════════════════════════════════════════════════════
// ── حفظ واسترجاع النماذج (المسودات) ──────────────────────────
function tgSaveFormDraft(saveAsNew) {
    var activePg = document.querySelector('.pg.a');
    if(!activePg) return;
    var formId = activePg.id.replace('pg-', '');
    if(formId === 'dash' || formId === 'account' || formId === 'livetrack' || formId === 'empdocs' || formId === 'announcements') {
        alert('لا يمكن حفظ هذه الصفحة كنموذج.');
        return;
    }
    
    // Find the first input value (usually the name) to suggest as title
    var inputs = activePg.querySelectorAll('input, textarea, select');
    var defaultTitle = '';
    for(var i=0; i<inputs.length; i++) {
        if(inputs[i].type !== 'button' && inputs[i].type !== 'submit' && inputs[i].value.trim()) {
            defaultTitle = inputs[i].value.trim();
            break;
        }
    }
    
    var data = [];
    inputs.forEach(function(inp) {
        if(inp.type === 'file' || inp.type === 'button' || inp.type === 'submit') return;
        var val = (inp.type === 'checkbox' || inp.type === 'radio') ? inp.checked : inp.value;
        data.push(val);
    });

    if (saveAsNew) {
        var newTitle = prompt('أدخل اسماً للنسخة الجديدة من النموذج:', window._currentLoadedFormTitle ? window._currentLoadedFormTitle + ' (نسخة)' : defaultTitle);
        if(!newTitle) return;
        _tgSaveAsNewDraft(formId, data, newTitle);
    } else if (window._currentLoadedFormId) {
        var msgId = tgToast('⏳ جارٍ الحفظ...', 'info', true);
        db.collection('savedForms').doc(window._currentLoadedFormId).set({
            formId: formId,
            title: window._currentLoadedFormTitle || defaultTitle || 'بدون اسم',
            data: JSON.stringify(data),
            savedBy: TG_USER.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(function() {
            tgToast('✅ تم الحفظ بنجاح!', 'ok');
            if(typeof populateDraftsSidebar === 'function') populateDraftsSidebar(formId);
        }).catch(function(err) {
            tgToast('❌ تعذر الحفظ: ' + err.message, 'err');
        });
    } else {
        var title = prompt('أدخل اسماً مميزاً لحفظ هذا النموذج (مثال: اسم الموظف):', defaultTitle);
        if(!title) return;
        _tgSaveAsNewDraft(formId, data, title);
    }
}

function _tgSaveAsNewDraft(formId, data, providedTitle) {
    var title = providedTitle || prompt('اسم النموذج (المرجع للحفظ):');
    if(!title) return;
    var msgId = tgToast('⏳ جارٍ الحفظ...', 'info', true);
    db.collection('savedForms').add({
        formId: formId,
        title: title,
        data: JSON.stringify(data),
        savedBy: TG_USER.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(docRef) {
        window._currentLoadedFormId = docRef.id;
        window._currentLoadedFormTitle = title;
        tgToast('✅ تم حفظ النموذج بنجاح!', 'ok');
        if(typeof populateDraftsSidebar === 'function') populateDraftsSidebar(formId);
    }).catch(function(err) {
        tgToast('❌ تعذر الحفظ: ' + err.message, 'err');
    });
}

function tgToggleDraftsSidebar() {
    var sb = document.getElementById('tgFormDraftsSidebar');
    var collapsed = document.getElementById('tgFormDraftsSidebarCollapsed');
    if(!sb || !collapsed) return;
    
    var isHidden = localStorage.getItem('tgHideDraftsSidebar') === 'true';
    if(isHidden) {
        localStorage.setItem('tgHideDraftsSidebar', 'false');
        sb.style.display = 'flex';
        collapsed.style.display = 'none';
        
        var activePg = document.querySelector('.pg.a');
        if(activePg) {
            var formId = activePg.id.replace('pg-', '');
            populateDraftsSidebar(formId);
        }
    } else {
        localStorage.setItem('tgHideDraftsSidebar', 'true');
        sb.style.display = 'none';
        collapsed.style.display = 'block';
    }
}

function populateDraftsSidebar(formId) {
    var sb = document.getElementById('tgFormDraftsSidebar');
    var lst = document.getElementById('fdsList');
    var collapsed = document.getElementById('tgFormDraftsSidebarCollapsed');
    if(!sb || !lst) return;
    
    if(['dash', 'account', 'livetrack', 'empdocs', 'announcements'].includes(formId)) {
        sb.style.display = 'none';
        if(collapsed) collapsed.style.display = 'none';
        return;
    }
    
    var isHidden = localStorage.getItem('tgHideDraftsSidebar') === 'true';
    if(isHidden) {
        sb.style.display = 'none';
        if(collapsed) collapsed.style.display = 'block';
        return;
    } else {
        sb.style.display = 'flex';
        if(collapsed) collapsed.style.display = 'none';
    }
    
    lst.innerHTML = '<div class="empty-hint" style="font-size:11px">⏳ جلب النماذج...</div>';
    
    db.collection('savedForms').where('formId','==',formId).get().then(function(snap){
        if(snap.empty) {
            lst.innerHTML = '<div class="empty-hint" style="font-size:11px">لا توجد نماذج محفوظة.</div>';
            return;
        }
        var docs = [];
        window._savedFormsData = window._savedFormsData || {};
        window._savedFormsTitles = window._savedFormsTitles || {};
        snap.forEach(function(d){ docs.push(d); });
        docs.sort(function(a,b){
            var ta = a.data().createdAt ? (a.data().createdAt.toDate ? a.data().createdAt.toDate().getTime() : new Date(a.data().createdAt).getTime()) : 0;
            var tb = b.data().createdAt ? (b.data().createdAt.toDate ? b.data().createdAt.toDate().getTime() : new Date(b.data().createdAt).getTime()) : 0;
            return tb - ta;
        });
        
        var h = '';
        docs.forEach(function(doc){
            var d = doc.data();
            window._savedFormsData[doc.id] = d.data || '';
            window._savedFormsTitles[doc.id] = d.title || '';
            
            var dateStr = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString('ar-EG') : '';
            
            h += '<div class="fds-item">';
            h += '<div class="fds-item-title">'+escH(d.title)+'</div>';
            h += '<div class="fds-item-date">'+dateStr+'</div>';
            h += '<div class="fds-item-actions">';
            h += '<button class="bt bt-p" onclick="tgApplySavedForm(\''+formId+'\', \''+doc.id+'\')">استرجاع</button>';
            h += '<button class="bt bt-g" onclick="tgPrintSavedForm(\''+formId+'\', \''+doc.id+'\')">طباعة</button>';
            h += '<button class="bt bt-d" onclick="tgDeleteSavedForm(\''+doc.id+'\', this)">حذف</button>';
            h += '</div></div>';
        });
        lst.innerHTML = h;
    }).catch(function(err){
        lst.innerHTML = '<div class="empty-hint" style="font-size:11px;color:var(--no)">خطأ!</div>';
    });
}

function tgClearForm() {
    if(!confirm('هل أنت متأكد من مسح جميع البيانات المدخلة في النموذج الحالي؟')) return;
    var activePg = document.querySelector('.pg.a');
    if(!activePg) return;
    var inputs = activePg.querySelectorAll('input, textarea, select');
    inputs.forEach(function(inp) {
        if(inp.type === 'button' || inp.type === 'submit') return;
        if(inp.type === 'checkbox' || inp.type === 'radio') inp.checked = false;
        else inp.value = '';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    window._currentLoadedFormId = null;
    window._currentLoadedFormTitle = null;
    tgToast('✅ تم مسح النموذج', 'ok');
}

function tgLoadFormDrafts() {
    var activePg = document.querySelector('.pg.a');
    if(!activePg) return;
    var formId = activePg.id.replace('pg-', '');
    if(formId === 'dash' || formId === 'account' || formId === 'livetrack' || formId === 'empdocs' || formId === 'announcements') {
        alert('لا يوجد نماذج محفوظة لهذه الصفحة.');
        return;
    }
    
    var pageTitle = document.getElementById('pT') ? document.getElementById('pT').textContent : formId;
    var modalTitle = '📂 النماذج المحفوظة ('+escH(pageTitle)+')';
    var modalHtml = '<div id="savedFormsList"><div class="empty-hint">⏳ جارٍ التحميل...</div></div>';
    tgConfirmModal(modalTitle, modalHtml, [{label: 'إغلاق', cls: 'bt-o', onClick: tgCloseModal}]);
    
    db.collection('savedForms').where('formId','==',formId).get().then(function(snap){
        var box = document.getElementById('savedFormsList');
        if(!box) return;
        if(snap.empty){
            box.innerHTML = '<div class="empty-hint">لا توجد نماذج محفوظة لهذه الصفحة.</div>';
            return;
        }
        var docs = [];
        window._savedFormsData = {};
        window._savedFormsTitles = {};
        snap.forEach(function(d){ docs.push(d); });
        docs.sort(function(a,b){
            var ta = a.data().createdAt ? (a.data().createdAt.toDate ? a.data().createdAt.toDate().getTime() : new Date(a.data().createdAt).getTime()) : 0;
            var tb = b.data().createdAt ? (b.data().createdAt.toDate ? b.data().createdAt.toDate().getTime() : new Date(b.data().createdAt).getTime()) : 0;
            return tb - ta;
        });

        var h = '<div style="display:flex;flex-direction:column;gap:8px">';
        docs.forEach(function(doc){
            var d = doc.data();
            window._savedFormsData[doc.id] = d.data || '';
            window._savedFormsTitles[doc.id] = d.title || '';
            h += '<div style="background:rgba(255,255,255,.05);padding:12px;border-radius:8px;display:flex;justify-content:space-between;align-items:center">';
            h += '<div><div style="font-weight:bold;margin-bottom:4px">'+escH(d.title)+'</div>';
            h += '<div style="font-size:11px;opacity:.6">'+(d.createdAt&&d.createdAt.toDate?d.createdAt.toDate().toLocaleString('ar-EG'):'')+'</div></div>';
            h += '<div style="display:flex;gap:8px">';
            h += '<button class="bt bt-g" style="padding:4px 10px;font-size:11px" onclick="tgPrintSavedForm(\''+formId+'\', \''+doc.id+'\')">📄 طباعة PDF</button>';
            h += '<button class="bt bt-p" style="padding:4px 10px;font-size:11px" onclick="tgApplySavedForm(\''+formId+'\', \''+doc.id+'\')">📥 استرجاع</button>';
            h += '<button class="bt bt-d" style="padding:4px 10px;font-size:11px" onclick="tgDeleteSavedForm(\''+doc.id+'\', this)">🗑 حذف</button>';
            h += '</div></div>';
        });
        h += '</div>';
        box.innerHTML = h;
    }).catch(function(err){
        var box = document.getElementById('savedFormsList');
        if(box) box.innerHTML = '<div class="empty-hint" style="color:var(--no)">خطأ: '+escH(err.message)+'</div>';
    });
}

function tgPrintSavedForm(formId, docId) {
    if(!confirm('عملية الطباعة ستستبدل البيانات الحالية في النموذج مؤقتاً بالبيانات المحفوظة. هل أنت متأكد؟')) return;
    tgApplySavedForm(formId, docId, true);
    tgCloseModal();
    if(typeof togglePrintKeepData === 'function') togglePrintKeepData(true);
    setTimeout(function() {
        openPrintPreview();
        setTimeout(doPrintNow, 500);
    }, 200);
}

function tgApplySavedForm(formId, docId, skipConfirm) {
    if(!skipConfirm && !confirm('سيتم استبدال البيانات الحالية بالبيانات المحفوظة. هل أنت متأكد؟')) return;
    try {
        var dataStr = window._savedFormsData ? window._savedFormsData[docId] : null;
        if(!dataStr) throw new Error("Data not found");
        var data = JSON.parse(dataStr);
        var activePg = document.getElementById('pg-'+formId);
        if(!activePg) return;
        var inputs = activePg.querySelectorAll('input, textarea, select');
        var dataIdx = 0;
        inputs.forEach(function(inp) {
            if(inp.type === 'file' || inp.type === 'button' || inp.type === 'submit') return;
            if(data[dataIdx] !== undefined) {
                if(inp.type === 'checkbox' || inp.type === 'radio') inp.checked = data[dataIdx];
                else inp.value = data[dataIdx];
                // Trigger input event for auto-expand textareas
                inp.dispatchEvent(new Event('input', { bubbles: true }));
            }
            dataIdx++;
        });
        if(!skipConfirm) {
            window._currentLoadedFormId = docId;
            window._currentLoadedFormTitle = window._savedFormsTitles ? window._savedFormsTitles[docId] : '';
        }
        tgCloseModal();
        tgToast('✅ تم استرجاع النموذج', 'ok');
    } catch(e) {
        alert('❌ خطأ في قراءة البيانات');
    }
}

function tgDeleteSavedForm(docId, btn) {
    if(!confirm('هل أنت متأكد من حذف هذا النموذج المحفوظ؟')) return;
    btn.disabled = true;
    db.collection('savedForms').doc(docId).delete().then(function(){
        btn.parentElement.parentElement.remove();
        tgToast('✅ تم الحذف', 'ok');
    }).catch(function(err){
        btn.disabled = false;
        alert('❌ تعذر الحذف: '+err.message);
    });
}

// ── ADMIN ATTENDANCE & CALENDAR ──────────────────────────────────────────
function loadAdminAttendance() {
    var dateInp = document.getElementById('adminAttDate');
    var box = document.getElementById('adminAttList');
    if(!dateInp || !box) return;
    var dStr = dateInp.value;
    if(!dStr) return;
    box.innerHTML = '<div class="empty-hint">⏳ جارٍ التحميل...</div>';
    
    db.collection('attendance').where('date','==',dStr).get().then(function(snap){
        if(snap.empty) {
            box.innerHTML = '<div class="empty-hint">لا يوجد سجل حضور لهذا اليوم.</div>';
            return;
        }
        var h = '<table class="dt"><tr><th>الموظف</th><th>وقت الحضور</th><th>الموقع (حضور)</th><th>وقت الانصراف</th><th>الموقع (انصراف)</th><th>ساعات العمل</th></tr>';
        snap.forEach(function(doc){
            var d = doc.data();
            var empName = EMPLOYEES[d.uid] ? EMPLOYEES[d.uid].name : 'مجهول';
            var inTime = d.checkIn && d.checkIn.toDate ? d.checkIn.toDate().toLocaleTimeString('ar-EG') : '-';
            var outTime = d.checkOut && d.checkOut.toDate ? d.checkOut.toDate().toLocaleTimeString('ar-EG') : '-';
            var locIn = d.locationIn ? '<a href="https://maps.google.com/?q='+d.locationIn+'" target="_blank">🗺️ عرض</a>' : '-';
            var locOut = d.locationOut ? '<a href="https://maps.google.com/?q='+d.locationOut+'" target="_blank">🗺️ عرض</a>' : '-';
            var hrs = d.totalHours ? d.totalHours.toFixed(2) + ' س' : '-';
            
            h += '<tr><td>'+escH(empName)+'</td><td>'+inTime+'</td><td>'+locIn+'</td><td>'+outTime+'</td><td>'+locOut+'</td><td style="font-weight:bold">'+hrs+'</td></tr>';
        });
        h += '</table>';
        box.innerHTML = h;
    }).catch(function(err){
        box.innerHTML = '<div class="empty-hint" style="color:var(--no)">خطأ: '+escH(err.message)+'</div>';
    });
}

function initAdminCalendar() {
    var calEl = document.getElementById('calendar');
    if(!calEl) return;
    if(typeof FullCalendar === 'undefined') {
        calEl.innerHTML = '<div class="empty-hint" style="color:var(--no)">تعذر تحميل مكتبة التقويم. الرجاء التحقق من الاتصال بالإنترنت.</div>';
        return;
    }
    
    var calendar = new FullCalendar.Calendar(calEl, {
        initialView: 'dayGridMonth',
        locale: 'ar',
        direction: 'rtl',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: function(info, successCallback, failureCallback) {
            var events = [];
            // Load Projects
            db.collection('projects').get().then(function(snap){
                snap.forEach(function(doc){
                    var d = doc.data();
                    if(d.deadline) {
                        events.push({
                            title: 'مشروع: ' + (d.title||'بدون عنوان'),
                            start: d.deadline,
                            color: '#e74c3c'
                        });
                    }
                });
                // Load approved vacations (requests)
                return db.collection('requests').where('status','==','approved').get();
            }).then(function(snap){
                snap.forEach(function(doc){
                    var d = doc.data();
                    if(d.from && d.to) {
                        var empName = EMPLOYEES[d.uid] ? EMPLOYEES[d.uid].name : '';
                        events.push({
                            title: 'إجازة: ' + empName,
                            start: d.from,
                            end: new Date(new Date(d.to).getTime() + 86400000).toISOString().split('T')[0], // Exclusive end date
                            color: '#2ecc71'
                        });
                    }
                });
                successCallback(events);
            }).catch(function(err){
                console.error(err);
                failureCallback(err);
            });
        }
    });
    calendar.render();
}

window.fetchLiveAttendance = async function() {
    var tbody = document.getElementById('liveAttBody');
    var dateInput = document.getElementById('liveAttDate');
    if(!tbody || !dateInput) return;
    
    var selectedDate = dateInput.value;
    if(!selectedDate) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;color:var(--tx3)">جارٍ جلب البيانات...</td></tr>';
    
    try {
        var snap = await db.collection('attendance_logs').where('date', '==', selectedDate).get();
        if(snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;color:var(--tx3)">لا يوجد سجلات حضور مسجلة في هذا اليوم.</td></tr>';
            return;
        }
        
        var logs = snap.docs.map(function(d){ return d.data(); });
        // ترتيب أبجدي حسب الاسم
        logs.sort(function(a,b) {
            var nA = a.name || '';
            var nB = b.name || '';
            return nA.localeCompare(nB);
        });

        var html = '';
        
        logs.forEach(function(log) {
            var checkIn = log.checkIn || '—';
            var checkOut = log.checkOut || '—';
            var hours = '—';
            
            if(log.checkIn && log.checkOut) {
                var t1 = new Date("2000-01-01T" + log.checkIn + ":00");
                var t2 = new Date("2000-01-01T" + log.checkOut + ":00");
                var diff = (t2 - t1) / 3600000;
                if(diff < 0) diff += 24;
                hours = diff > 0 ? diff.toFixed(1) + ' ساعة' : '—';
            }
            
            html += '<tr>' +
                '<td style="font-weight:bold;color:var(--nv)">' + (log.name || 'مجهول') + '</td>' +
                '<td>' + log.date + '</td>' +
                '<td style="color:#059669;font-weight:bold">' + checkIn + '</td>' +
                '<td style="color:#dc2626;font-weight:bold">' + checkOut + '</td>' +
                '<td style="font-weight:bold">' + hours + '</td>' +
                '</tr>';
        });
        
        tbody.innerHTML = html;
        
    } catch(e) {
        console.error("fetchLiveAttendance error:", e);
        tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;color:red">حدث خطأ أثناء جلب البيانات</td></tr>';
    }
};

// ─── بروفايل الموظف المنظم ──────────────────────────────────────────
function tgOpenEmployeeProfile(uid) {
    var emp = (window._staffEmpCache || []).find(function(e){ return e.uid === uid; });
    if(!emp) {
        // لو مش موجود في الكاش (مثلاً لو موظف داخل يشوف بروفايله)، نجيبه من الداتابيز
        db.collection('users').doc(uid).get().then(function(snap){
            if(!snap.exists) return;
            var data = Object.assign({uid:snap.id}, snap.data());
            // جلب البيانات المرتبطة
            Promise.all([
                db.collection('projects').where('assignees','array-contains',uid).get(),
                db.collection('achievements').where('uid','==',uid).get(),
                db.collection('requests').where('uid','==',uid).get(),
                db.collection('weeklyReports').where('uid','==',uid).get(),
                db.collection('tasks').where('assignedTo','==',uid).get()
            ]).then(function(res){
                data.projects = res[0].docs.map(function(d){return Object.assign({id:d.id},d.data());});
                data.achievements = res[1].docs.map(function(d){return Object.assign({id:d.id},d.data());}).sort(function(a,b){return (a.date<b.date)?1:-1;});
                data.requests = res[2].docs.map(function(d){return Object.assign({id:d.id},d.data());}).sort(function(a,b){return (a.createdAt<b.createdAt)?1:-1;});
                data.weeklyReports = res[3].docs.map(function(d){return Object.assign({id:d.id},d.data());}).sort(function(a,b){return (a.weekStart<b.weekStart)?1:-1;});
                data.tasks = res[4].docs.map(function(d){return Object.assign({id:d.id},d.data());}).sort(function(a,b){return (a.createdAt<b.createdAt)?1:-1;});
                
                renderEmployeeProfileModal(data);
            });
        });
        return;
    }
    
    // لو الأدمن بيفتحه، نجيب المهام كمان (مش موجودة في كاش الموظفين الافتراضي)
    db.collection('tasks').where('assignedTo','==',uid).get().then(function(snap){
        emp.tasks = snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});
        renderEmployeeProfileModal(emp);
    });
}

function renderEmployeeProfileModal(emp) {
    var modal = document.getElementById('tgProfileModal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'tgProfileModal';
        modal.className = 'profile-modal';
        document.body.appendChild(modal);
    }
    
    var initials = (emp.name || emp.email || 'U').split(' ').map(function(n){return n[0];}).join('').toUpperCase().substring(0,2);
    var avgProg = emp.projects.length ? Math.round(emp.projects.reduce(function(s,p){
        var pm = (p.progressMap && p.progressMap[emp.uid]) ? p.progressMap[emp.uid].progress : 0;
        return s + (pm || 0);
    }, 0) / emp.projects.length) : 0;

    var h = '<div class="profile-container">' +
        '<div class="profile-header">' +
            '<div class="profile-close" onclick="tgCloseProfile()">✕</div>' +
            '<div class="profile-info">' +
                '<div class="profile-avatar">' + initials + '</div>' +
                '<div class="profile-details">' +
                    '<div class="profile-name">' + escH(emp.name || emp.email) + '</div>' +
                    '<div class="profile-job">💼 ' + escH(emp.jobTitle || 'موظف') + ' · 📧 ' + escH(emp.email) + '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="profile-nav">' +
            '<div class="profile-tab a" data-pt="ov" onclick="tgProfileGo(\'ov\',this)">🏠 نظرة عامة</div>' +
            '<div class="profile-tab" data-pt="pj" onclick="tgProfileGo(\'pj\',this)">📁 المشاريع ('+emp.projects.length+')</div>' +
            '<div class="profile-tab" data-pt="tk" onclick="tgProfileGo(\'tk\',this)">🗂 المهام ('+(emp.tasks?emp.tasks.length:0)+')</div>' +
            '<div class="profile-tab" data-pt="ac" onclick="tgProfileGo(\'ac\',this)">🏆 الإنجازات ('+emp.achievements.length+')</div>' +
            '<div class="profile-tab" data-pt="wr" onclick="tgProfileGo(\'wr\',this)">📊 التقارير ('+emp.weeklyReports.length+')</div>' +
            '<div class="profile-tab" data-pt="rq" onclick="tgProfileGo(\'rq\',this)">📨 الطلبات ('+emp.requests.length+')</div>' +
        '</div>' +
        '<div class="profile-content">' +
            // Overview
            '<div class="profile-pg a" id="ppg-ov">' +
                '<div class="p-stats">' +
                    '<div class="p-stat-box"><div class="p-stat-val">' + emp.projects.length + '</div><div class="p-stat-lbl">مشاريع</div></div>' +
                    '<div class="p-stat-box"><div class="p-stat-val">' + avgProg + '%</div><div class="p-stat-lbl">متوسط التقدم</div></div>' +
                    '<div class="p-stat-box"><div class="p-stat-val">' + emp.achievements.length + '</div><div class="p-stat-lbl">إنجازات</div></div>' +
                    '<div class="p-stat-box"><div class="p-stat-val">' + emp.weeklyReports.length + '</div><div class="p-stat-lbl">تقارير</div></div>' +
                '</div>' +
                '<div class="profile-grid">' +
                    '<div class="p-card"><div class="p-card-h">🧑 البيانات الشخصية</div>' +
                        '<div class="p-info-list">' +
                            '<div class="p-info-item"><span class="p-info-lbl">الاسم</span><span class="p-info-val">' + escH(emp.name || '-') + '</span></div>' +
                            '<div class="p-info-item"><span class="p-info-lbl">المسمى الوظيفي</span><span class="p-info-val">' + escH(emp.jobTitle || '-') + '</span></div>' +
                            '<div class="p-info-item"><span class="p-info-lbl">البريد الإلكتروني</span><span class="p-info-val">' + escH(emp.email || '-') + '</span></div>' +
                            '<div class="p-info-item"><span class="p-info-lbl">نظام العمل</span><span class="p-info-val">' + (emp.workMode==='remote'?'عن بُعد':'من المكتب') + '</span></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="p-card"><div class="p-card-h">📅 آخر النشاطات</div>' +
                        '<div class="empty-hint" style="font-size:11px">سيتم ربط سجل النشاطات لاحقاً...</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            // Projects
            '<div class="profile-pg" id="ppg-pj">' +
                '<div class="profile-grid">' +
                    (emp.projects.length ? emp.projects.map(function(p){
                        var pm = (p.progressMap && p.progressMap[emp.uid]) || {progress:0, status:'لم يبدأ'};
                        return '<div class="p-card"><div class="p-card-h">📁 ' + escH(p.title) + '</div>' +
                               '<div class="pj-bar"><div class="pj-bar-in" style="width:'+pm.progress+'%"></div></div>' +
                               '<div style="font-size:11px;margin-top:8px;display:flex;justify-content:space-between">' +
                               '<span>الحالة: <b>'+escH(pm.status)+'</b></span><span>'+pm.progress+'%</span></div>' +
                               '</div>';
                    }).join('') : '<div class="empty-hint">لا توجد مشاريع حالية.</div>') +
                '</div>' +
            '</div>' +
            // Tasks
            '<div class="profile-pg" id="ppg-tk">' +
                '<div class="profile-grid">' +
                    (emp.tasks && emp.tasks.length ? emp.tasks.map(function(t){
                        return '<div class="p-card"><div class="p-card-h">🗂 ' + escH(t.title) + '</div>' +
                               '<div style="font-size:11px;opacity:0.8">' + escH(t.description || '') + '</div>' +
                               '<div style="margin-top:10px"><span class="badge '+pstatusBadgeClass(t.status)+'">'+escH(t.status)+'</span></div>' +
                               '</div>';
                    }).join('') : '<div class="empty-hint">لا توجد مهام حالية.</div>') +
                '</div>' +
            '</div>' +
            // Achievements
            '<div class="profile-pg" id="ppg-ac">' +
                '<div class="p-timeline">' +
                    (emp.achievements.length ? emp.achievements.map(function(a){
                        return '<div class="p-timeline-item"><div class="p-timeline-dot"></div>' +
                               '<div class="p-timeline-content"><div class="p-timeline-date">' + escH(a.date) + '</div>' +
                               '<div class="p-timeline-title">' + escH(a.title) + '</div>' +
                               (a.description?'<div style="font-size:11px;opacity:0.7;margin-top:4px">'+escH(a.description)+'</div>':'') +
                               '</div></div>';
                    }).join('') : '<div class="empty-hint">لا توجد إنجازات مسجلة.</div>') +
                '</div>' +
            '</div>' +
            // Weekly Reports
            '<div class="profile-pg" id="ppg-wr">' +
                '<div class="profile-grid">' +
                    (emp.weeklyReports.length ? emp.weeklyReports.map(function(r){
                        return '<div class="p-card"><div class="p-card-h">📅 أسبوع ' + escH(r.weekStart) + '</div>' +
                               '<div style="font-size:11px;opacity:0.8;white-space:pre-wrap">' + escH(r.content) + '</div>' +
                               '</div>';
                    }).join('') : '<div class="empty-hint">لا توجد تقارير أسبوعية.</div>') +
                '</div>' +
            '</div>' +
            // Requests
            '<div class="profile-pg" id="ppg-rq">' +
                '<div class="profile-grid">' +
                    (emp.requests.length ? emp.requests.map(function(r){
                        return '<div class="p-card"><div class="p-card-h">📨 ' + escH(r.type) + '</div>' +
                               '<div style="font-size:11px;margin-bottom:8px">' + escH(r.details || '') + '</div>' +
                               (function(){
                                   if(!r.dynamicData) return '';
                                   var dh = '<div style="margin-bottom:8px;padding:8px;background:rgba(0,0,0,0.04);border-radius:6px;font-size:11px;">';
                                   var tpl = window.FS_TEMPLATES && r.formTemplateId ? window.FS_TEMPLATES[r.formTemplateId] : null;
                                   var fieldLabels = {};
                                   if(tpl && tpl.fields) { tpl.fields.forEach(function(f){ fieldLabels[f.id] = f.label; }); }
                                   for(var k in r.dynamicData){
                                       var v = r.dynamicData[k];
                                       if(v === true) v = 'نعم / تم';
                                       if(v === false) v = 'لا';
                                       var lbl = fieldLabels[k] || k;
                                       if(lbl === 'chk1') lbl = 'تسليم العهدة المالية';
                                       if(lbl === 'chk2') lbl = 'تسليم العهدة العينية';
                                       if(lbl === 'chk3') lbl = 'تسليم المستندات والملفات';
                                       if(lbl === 'chk4') lbl = 'إنهاء المهام المعلقة';
                                       dh += '<div style="margin-bottom:3px;"><span style="color:var(--tx3);display:inline-block;width:100px;">' + escH(lbl) + ':</span> <b style="white-space:pre-wrap;">' + escH(v) + '</b></div>';
                                   }
                                   dh += '</div>';
                                   return dh;
                               })() +
                               '<div><span class="badge '+badgeClassForReq(r.status)+'">'+reqStatusLabel(r.status)+'</span></div>' +
                               '</div>';
                    }).join('') : '<div class="empty-hint">لا توجد طلبات سابقة.</div>') +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    modal.innerHTML = h;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function tgCloseProfile() {
    var modal = document.getElementById('tgProfileModal');
    if(modal) modal.classList.remove('open');
    document.body.style.overflow = '';
}

function tgProfileGo(id, el) {
    document.querySelectorAll('.profile-tab').forEach(function(t){ t.classList.remove('a'); });
    document.querySelectorAll('.profile-pg').forEach(function(p){ p.classList.remove('a'); });
    el.classList.add('a');
    document.getElementById('ppg-' + id).classList.add('a');
}

// 🎊 دالة الاحتفال (Confetti Celebration)
function tgCelebrate() {
    // تشغيل صوت احتفالي (Fanfare)
    try {
        var ctx = window._tgAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window._tgAudioCtx = ctx;
        if (ctx.state === 'suspended') ctx.resume();
        var now = ctx.currentTime;
        var tone = function(f, s, d, v) { 
            if(typeof _tgTone === 'function') _tgTone(ctx, f, s, d, v); 
        };
        // نغمات احتفالية متصاعدة
        tone(523.25, now, 0.1, 0.2);       // C5
        tone(659.25, now + 0.1, 0.1, 0.2); // E5
        tone(783.99, now + 0.2, 0.1, 0.2); // G5
        tone(1046.50, now + 0.3, 0.4, 0.3); // C6 (أعلى وأطول)
    } catch(e) {}

    if (typeof confetti !== 'function') return;
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999999 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount: particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount: particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// ─── Weekly Report Reminder ───────────────────────────────────────────────
function sendWeeklyReportReminder() {
    var btn = document.getElementById('sysrepReminderBtn');
    if(btn) { btn.disabled = true; btn.textContent = '⏳ جاري الإرسال...'; }
    
    // إرسال تنبيه وتنبيه شاشي فوري لتجربة وتأكيد الإشعار
    if (typeof tgShowNotification === 'function') {
        tgShowNotification('🚨 تذكير يوم الخميس الأسبوعي', 'اليوم الخميس! يرجى إرسال التقرير الأسبوعي الخاص بك قبل نهاية اليوم.', { tag: 'weekly-report-reminder' });
    }
    if (typeof tgShowToast === 'function') {
        tgShowToast('🚨 تم تفعيل وإرسال تذكير يوم الخميس الموحد بالتقرير الأسبوعي بنجاح!');
    }
    if (typeof tgShowReminderBannerIfNeeded === 'function') {
        tgShowReminderBannerIfNeeded(false, false, false, new Date().getDate());
    }

    db.collection('users').where('role', '==', 'employee').get().then(function(snap) {
        var count = 0;
        snap.forEach(function(d) {
            tgSendPushToUser(d.id, '🚨 تذكير يوم الخميس الأسبوعي', 'اليوم الخميس! يرجى إرسال التقرير الأسبوعي الخاص بك قبل نهاية اليوم.', 'weekly-report-reminder');
            count++;
        });
        if(btn) { btn.disabled = false; btn.textContent = '✅ تم تذكير ' + count + ' موظف'; }
        setTimeout(function(){ if(btn) btn.textContent = '🔔 تذكير الموظفين بالتقرير الأسبوعي (الخميس)'; }, 3000);
    }).catch(function(err) {
        console.error(err);
        if(btn) { btn.disabled = false; btn.textContent = '❌ حدث خطأ'; }
        setTimeout(function(){ if(btn) btn.textContent = '🔔 تذكير الموظفين بالتقرير الأسبوعي (الخميس)'; }, 3000);
    });
}

window.tgTestThursdayReminder = function() {
    sendWeeklyReportReminder();
};
// Migration Script to add jobTitles to names globally
window.tgMigrateNames = function() {
    if(!confirm('هل أنت متأكد من تشغيل سكريبت دمج المسميات الوظيفية؟ (يجب أن يتم مرة واحدة فقط)')) return;
    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1b2a4a;color:#fff;padding:14px 28px;border-radius:10px;z-index:99999;font-size:14px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    msg.textContent = '⏳ جاري الدمج (تحديث الموظفين)...';
    document.body.appendChild(msg);

    var usersMap = {};

    // 1. Update all users
    db.collection('users').get().then(function(snap) {
        var batch = db.batch();
        var count = 0;
        snap.forEach(function(doc) {
            var data = doc.data();
            var jobTitle = data.jobTitle || '';
            var baseName = data.baseName || data.name || '';
            
            // Clean up if it already has parenthesis
            if (baseName.includes(' (')) {
                baseName = baseName.split(' (')[0].trim();
            }
            
            var finalName = jobTitle ? baseName + ' (' + jobTitle + ')' : baseName;
            
            usersMap[doc.id] = finalName;
            
            batch.update(doc.ref, {
                baseName: baseName,
                name: finalName
            });
            count++;
        });
        
        return batch.commit().then(function() {
            msg.textContent = '⏳ تم تحديث الموظفين (' + count + '). جاري تحديث المهام والمشاريع...';
            return migrateTasksAndProjects(usersMap);
        });
    }).then(function() {
        if(document.body.contains(msg)) document.body.removeChild(msg);
        alert('✅ تم الانتهاء من تحديث جميع الأسماء والمهام والمشاريع في النظام بنجاح!');
        location.reload();
    }).catch(function(err) {
        if(document.body.contains(msg)) document.body.removeChild(msg);
        alert('❌ حدث خطأ: ' + err.message);
    });

    function migrateTasksAndProjects(uMap) {
        var promises = [];
        
        // Update Tasks
        var p1 = db.collection('tasks').get().then(function(snap) {
            var batch = db.batch();
            snap.forEach(function(doc) {
                var d = doc.data();
                var updates = {};
                var changed = false;
                if (d.assignedTo && uMap[d.assignedTo] && d.assignedToName !== uMap[d.assignedTo]) {
                    updates.assignedToName = uMap[d.assignedTo];
                    changed = true;
                }
                if (d.createdByUid && uMap[d.createdByUid] && d.createdBy !== uMap[d.createdByUid]) {
                    updates.createdBy = uMap[d.createdByUid];
                    changed = true;
                }
                if (changed) batch.update(doc.ref, updates);
            });
            return batch.commit();
        });
        promises.push(p1);

        // Update Projects
        var p2 = db.collection('projects').get().then(function(snap) {
            var batch = db.batch();
            snap.forEach(function(doc) {
                var d = doc.data();
                var updates = {};
                var changed = false;
                if (d.assignedTo && uMap[d.assignedTo] && d.assignedToName !== uMap[d.assignedTo]) {
                    updates.assignedToName = uMap[d.assignedTo];
                    changed = true;
                }
                if (d.createdByUid && uMap[d.createdByUid] && d.createdBy !== uMap[d.createdByUid]) {
                    updates.createdBy = uMap[d.createdByUid];
                    changed = true;
                }
                if (changed) batch.update(doc.ref, updates);
            });
            return batch.commit();
        });
        promises.push(p2);

        return Promise.all(promises);
    }
};



// ─── ميزة أرشيف المستندات ─────────────────────────────────────────────
var tgArchiveCache = [];
function loadArchive() {
    var c = document.getElementById('pg-archive');
    if(!c) return;
    document.getElementById('pT').innerText = 'أرشيف المستندات';
    c.classList.add('a');
    if(!c.dataset.mounted) {
        c.dataset.mounted = '1';
        db.collection('docArchive').orderBy('createdAt', 'desc').limit(200).onSnapshot(function(snap){
            tgArchiveCache = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
            tgRenderArchive();
        });
    }
}

function tgRenderArchive() {
    var box = document.getElementById('arcList');
    if(!box) return;
    var ef = (document.getElementById('arcEmpFilter').value || '').toLowerCase();
    var mf = document.getElementById('arcMonthFilter').value; // YYYY-MM
    var html = '';
    var count = 0;
    for(var i=0; i<tgArchiveCache.length; i++){
        var d = tgArchiveCache[i];
        if(ef && d.employeeName && d.employeeName.toLowerCase().indexOf(ef)===-1) continue;
        if(mf) {
            var dt = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : new Date();
            var mStr = dt.getFullYear() + '-' + ('0'+(dt.getMonth()+1)).slice(-2);
            if(mStr !== mf) continue;
        }
        count++;
        var ts = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleString('ar-EG') : '';
        html += '<div class="pj-row" style="display:flex; justify-content:space-between; align-items:center;">';
        html += '<div><div class="pj-t">'+escH(d.docTitle)+'</div><div class="pj-meta">👤 '+escH(d.employeeName)+' | 🕒 '+ts+'</div></div>';
        html += '<button class="bt bt-o" style="padding:4px 8px; font-size:11px" onclick="tgViewArchiveDoc(\''+d.id+'\')">👁 عرض</button>';
        html += '</div>';
    }
    if(count === 0) html = '<div class="empty-hint">لا توجد مستندات مطابقة في الأرشيف.</div>';
    box.innerHTML = html;
}

function tgViewArchiveDoc(id) {
    var d = tgArchiveCache.find(function(x){ return x.id === id; });
    if(!d) return;
    var win = window.open('', '_blank');
    if(win) {
        win.document.write(d.htmlContent || 'محتوى غير متوفر');
        win.document.close();
    } else {
        alert('يرجى السماح بالنوافذ المنبثقة (Popups) لعرض المستند.');
    }
}

// ─── ميزة التعبئة التلقائية ──────────────────────────────────────────
var tgAutoEmpList = [];
function tgLoadAutoCompleteList() {
    db.collection('users').where('role','in',['employee','tech_admin']).get().then(function(snap){
        tgAutoEmpList = snap.docs.map(function(d){ return Object.assign({uid:d.id}, d.data()); });
        tgAutoEmpList.sort(function(a,b){ return (a.name||a.email||'').localeCompare(b.name||b.email||''); });
        
        // 1. Update top bar select if exists
        var sel = document.getElementById('tgAutoCompleteEmp');
        if(sel) {
            var opts = '<option value="">تعبئة بيانات موظف...</option>';
        tgAutoEmpList.forEach(function(e){ opts += '<option value="'+e.uid+'">'+escH(e.name||e.email)+'</option>'; });
            sel.innerHTML = opts;
        }
        
        // 2. Create datalist for inline form autocomplete
        var dl = document.getElementById('tgEmpNamesDatalist');
        if(!dl) {
            dl = document.createElement('datalist');
            dl.id = 'tgEmpNamesDatalist';
            document.body.appendChild(dl);
        }
        var dlOpts = '';
        tgAutoEmpList.forEach(function(e){ dlOpts += '<option value="'+escH(e.name||e.email)+'">'; });
        dl.innerHTML = dlOpts;
        
        // 3. Attach list to all existing name inputs
        tgAttachDatalistToInputs();
    });
}

window.openLiveCallOverlay = function(roomName, title) {
    var room = roomName || 'TechGo_Company_Main_Meeting';
    var meetingTitle = title || 'غرفة الاجتماعات المباشرة للشركة';
    
    var u = window.TG_USER || {};
    var userName = u.name || u.displayName || (window.firebase && firebase.auth && firebase.auth().currentUser && firebase.auth().currentUser.displayName) || 'عضو في الفريق';
    
    // Hash parameters to bypass login / prejoin step completely and set name automatically
    var hashConfig = `#userInfo.displayName=${encodeURIComponent(userName)}&config.prejoinPageEnabled=false&config.requireDisplayName=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;
    var directUrl = `https://meet.ffmuc.net/${room}${hashConfig}`;

    // Attempt direct window launch (if browser permits)
    try {
        var win = window.open(directUrl, '_blank');
        if (win) win.focus();
    } catch(e) {}

    // Update overlay modal
    var modal = document.getElementById('liveCallOverlayModal');
    var body = document.getElementById('liveCallOverlayBody');
    var titleEl = document.getElementById('liveCallOverlayTitle');
    var extBtn = document.getElementById('liveCallExternalBtn');

    if(titleEl) titleEl.innerText = `🟢 ${meetingTitle}`;
    if(extBtn) extBtn.href = directUrl;

    if(body) {
        body.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; padding:30px; color:#ffffff; font-family:inherit; background:#0f172a;">
                <div style="font-size:75px; margin-bottom:20px; animation:bouncePhone 2s infinite alternate;">🎥</div>
                <span style="background:rgba(16,185,129,0.25); color:#34d399; border:1px solid #10b981; padding:6px 20px; border-radius:30px; font-size:13px; font-weight:800; margin-bottom:15px;">🟢 مرحباً: ${userName} (الدخول مباشر بدون تسجيل)</span>
                <h2 style="font-size:28px; font-weight:900; margin-bottom:12px; color:#ffffff; text-shadow:0 2px 10px rgba(0,0,0,0.5);">غرفة الاجتماعات المباشرة للشركة</h2>
                <p style="font-size:15px; color:#cbd5e1; max-width:580px; margin:0 auto 30px; line-height:1.7; font-weight:500;">
                    انقر على الزر الأخضر بالأسفل للانضمام الفوري لغرفة الاجتماعات باسمك الرسمي (<b style="color:#38bdf8;">${userName}</b>).
                </p>
                <div style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center;">
                    <a href="${directUrl}" target="_blank" rel="noopener noreferrer" style="background:linear-gradient(135deg, #059669, #10b981); color:#ffffff; border:none; padding:16px 40px; border-radius:50px; font-size:17px; font-weight:900; text-decoration:none; display:inline-flex; align-items:center; gap:10px; box-shadow:0 8px 30px rgba(16,185,129,0.5); cursor:pointer;">
                        <span>🚀</span> الانضمام لغرفة الاجتماعات الآن
                    </a>
                    <button type="button" onclick="closeLiveCallOverlay()" style="background:#1e293b; color:#f8fafc; border:1.5px solid #475569; padding:16px 30px; border-radius:50px; font-size:15px; font-weight:800; cursor:pointer; box-shadow:0 4px 15px rgba(0,0,0,0.3);">
                        ✖ إغلاق هذه النافذة
                    </button>
                </div>
            </div>
        `;
    }

    if(modal) {
        modal.style.cssText = 'display:flex !important; position:fixed; top:0; left:0; right:0; bottom:0; background:#0f172a; z-index:99999999; flex-direction:column; font-family:inherit;';
    }

    _currentRoomUrl = directUrl;
};

window.closeLiveCallOverlay = function() {
    var modal = document.getElementById('liveCallOverlayModal');
    var body = document.getElementById('liveCallOverlayBody');
    if(modal) modal.style.cssText = 'display:none !important;';
    if(body) body.innerHTML = '';
};

window.startNewMeeting = async function(targetEmpId, targetEmpName, isGroup) {
    var myUid = (window.TG_USER && TG_USER.uid) ? TG_USER.uid : '';
    var myName = (window.TG_USER && (TG_USER.displayName || TG_USER.name)) ? (TG_USER.displayName || TG_USER.name) : "مستخدم";

    // 1. Busy check: Prevent calling if target or self is already in a call
    if(!isGroup && targetEmpId) {
        if (window._activeCallUsers && window._activeCallUsers.has(targetEmpId)) {
            alert(`❌ الموظف (${targetEmpName}) في مكالمة أخرى حالياً. يرجى المحاولة لاحقاً.`);
            return;
        }
        if (window._currentMeetingId) {
            alert(`❌ أنت في مكالمة بالفعل حالياً. يرجى إنهاء المكالمة الحالية أولاً.`);
            return;
        }
    }
    
    var topic = isGroup ? "اجتماع جماعي" : `مكالمة فردية مع ${targetEmpName}`;
    var roomName = "TechGo_Call_" + Date.now() + "_" + Math.floor(Math.random()*1000);
    // Unlimited Freifunk High-Speed Video Server - NO 5 MINUTE LIMITS!
    var roomUrl = `https://meet.ffmuc.net/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;
    _currentRoomUrl = roomUrl;

    try {
        // Auto-end any old stuck calls between these two users before starting a new one
        if (!isGroup && window.db) {
            try {
                var oldSnap = await db.collection('meetings').where('status', 'in', ['calling', 'active']).get();
                oldSnap.forEach(function(oldDoc) {
                    var d = oldDoc.data();
                    if ((d.createdBy === myUid && d.targetUid === targetEmpId) ||
                        (d.createdBy === targetEmpId && d.targetUid === myUid)) {
                        db.collection('meetings').doc(oldDoc.id).update({ status: 'ended' }).catch(function(){});
                    }
                });
            } catch(err) {}
        }
        
        var meetingData = {
            roomName: roomName,
            topic: topic,
            isGroup: isGroup,
            createdBy: myUid,
            createdByName: myName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'calling'
        };
        
        if(!isGroup) {
            meetingData.targetUid = targetEmpId;
            meetingData.targetName = targetEmpName;
        }
        
        var meetingRef = await db.collection('meetings').add(meetingData);
        _currentMeetingId = meetingRef.id;
        
        // Play Outgoing Ringback sound for Caller
        if (typeof playOutgoingRinging === 'function') playOutgoingRinging();

        // Show Outgoing Call Modal for Caller
        var outModal = document.getElementById('outgoingMeetingModal');
        var outText = document.getElementById('outgoingCallStatusText');
        var outTarget = document.getElementById('outgoingTargetNameText');
        var outLink = document.getElementById('outgoingDirectRoomLink');
        var outIcon = document.getElementById('outgoingCallIcon');
        var outTag = document.getElementById('outgoingCallTag');
        
        if(outIcon) outIcon.innerHTML = '📞';
        if(outTag) {
            outTag.style.cssText = 'display:inline-block; background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid rgba(59,130,246,0.4); padding:6px 18px; border-radius:30px; font-size:13px; font-weight:bold; margin-bottom:15px; letter-spacing:0.5px;';
            outTag.innerText = '📡 جاري الاتصال المباشر (رنين جارٍ 🔔)';
        }
        if(outText) outText.innerText = "جاري الاتصال...";
        if(outTarget) outTarget.innerHTML = isGroup ? `🔔 جاري رنين هاتف الموظفين...` : `🔔 جاري الرنين على: ${targetEmpName}`;
        if(outLink) outLink.href = roomUrl;
        if(outModal) outModal.style.cssText = 'display:flex !important; position:fixed; top:0; left:0; right:0; bottom:0; background:radial-gradient(circle at center, rgba(59,130,246,0.2) 0%, rgba(15,23,42,0.98) 100%); z-index:9999999; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(16px); font-family:inherit;';
        
        // Listen for status changes (accepted / rejected / ended)
        if(window._callStatusUnsubscribe) { window._callStatusUnsubscribe(); }
        window._callStatusUnsubscribe = db.collection('meetings').doc(_currentMeetingId).onSnapshot(function(doc) {
            if(!doc.exists) return;
            var d = doc.data();
            
            if(d.status === 'active') {
                if (typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
                if(outModal) outModal.style.cssText = 'display:none !important;';
                openLiveCallOverlay(d.roomName || roomName, d.topic || topic);
            } else if(d.status === 'rejected') {
                if (typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
                if(outIcon) outIcon.innerHTML = '🚫';
                if(outTag) {
                    outTag.style.cssText = 'display:inline-block; background:rgba(239,68,68,0.25); color:#f87171; border:1px solid rgba(239,68,68,0.5); padding:6px 18px; border-radius:30px; font-size:13px; font-weight:bold; margin-bottom:15px;';
                    outTag.innerText = '❌ تم رفض المكالمة';
                }
                if(outText) outText.innerText = "المكالمة مرفوضة من الطرف الآخر";
                if(outTarget) outTarget.innerHTML = `<span style="color:#ef4444; text-shadow:0 2px 10px rgba(239,68,68,0.4);">❌ قام الموظف برفض المكالمة حالياً</span>`;
                
                setTimeout(function() {
                    if(outModal) outModal.style.cssText = 'display:none !important;';
                    endCall();
                }, 3000);
            } else if(d.status === 'ended') {
                if (typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
                if(outText) outText.innerText = "❌ تم إنهاء المكالمة.";
                setTimeout(function() {
                    if(outModal) outModal.style.cssText = 'display:none !important;';
                    endCall();
                }, 1200);
            }
        });
        
        // 4. Send Instant Web Push Notification to Target Employee
        if(!isGroup && targetEmpId && typeof tgSendPushToUser === 'function') {
            tgSendPushToUser(targetEmpId, "📞 مكالمة واردة جديدة", `مكالمة واردة من ${myName}. اضغط للانضمام والمكالمة بالصوت والفيديو.`, 'livemeeting', '', {
                meetingId: _currentMeetingId,
                roomName: roomName,
                topic: topic,
                isCall: true
            });
        } else if(isGroup) {
            if(typeof tgBroadcastPush === 'function') {
                tgBroadcastPush('🎥 اجتماع مباشر', `يوجد اجتماع جماعي الآن: ${topic}. يرجى الانضمام.`, 'livemeeting', '', {
                    meetingId: _currentMeetingId,
                    roomName: roomName,
                    topic: topic,
                    isCall: true
                });
            }
        }
        
    } catch(e) {
        if (typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
        console.error("Error creating meeting:", e);
        alert("حدث خطأ أثناء محاولة بدء الاجتماع. يرجى المحاولة مرة أخرى.");
    }
};

window.startJitsiMeeting = function(roomName, subject, isCreator) {
    openLiveCallOverlay(roomName, subject);
};

function tgAttachDatalistToInputs() {
    document.querySelectorAll('input').forEach(function(el){
        var fid = el.getAttribute('data-fid');
        var isName = (fid === 'name');
        if(!isName && el.previousElementSibling) {
            var txt = el.previousElementSibling.textContent || '';
            if(txt.indexOf('الاسم') > -1 || txt.indexOf('الموظف') > -1) isName = true;
        }
        if(!isName && el.placeholder && (el.placeholder.indexOf('اسم') > -1 || el.placeholder.indexOf('الموظف') > -1)) {
            isName = true;
        }
        if(isName && el.type === 'text') {
            el.setAttribute('list', 'tgEmpNamesDatalist');
        }
    });
}

// Attach datalist when pages change
var oldGo = go;
window.go = function(id, nav, force) {
    oldGo(id, nav, force);
    setTimeout(tgAttachDatalistToInputs, 300);
    if(id === 'livemeeting') {
        if(typeof initMeetingsListener === 'function') initMeetingsListener();
        if(typeof loadUsersForCalls === 'function') loadUsersForCalls();
    }
};

// Listen for selection from datalist
document.addEventListener('input', function(e) {
    if(e.target && e.target.tagName === 'INPUT' && e.target.getAttribute('list') === 'tgEmpNamesDatalist') {
        var val = e.target.value;
        var emp = tgAutoEmpList.find(function(x){ return (x.name === val || x.email === val); });
        if(emp) {
            tgAutoCompleteForm(emp.uid, e.target);
        }
    }
});

setTimeout(tgLoadAutoCompleteList, 3000); // load after 3s

function tgAutoCompleteForm(uid, targetEl) {
    if(!uid) return;
    var emp = tgAutoEmpList.find(function(x){ return x.uid === uid; });
    if(!emp) return;
    var activePg = targetEl ? targetEl.closest('.pg') : document.querySelector('.pg.a');
    if(!activePg) activePg = document.querySelector('.pg.a');
    if(!activePg) return;
    
    // map fields to keys in employee data
    var mappings = [
        { labels: ['الاسم', 'الموظف'], key: 'name' },
        { labels: ['الرقم القومي'], key: 'nid' },
        { labels: ['الجنسية'], key: 'nationality' },
        { labels: ['الحالة الاجتماعية'], key: 'marital' },
        { labels: ['رقم الهاتف', 'التواصل'], key: 'phone' },
        { labels: ['البريد'], key: 'email' },
        { labels: ['العنوان'], key: 'address' },
        { labels: ['المسمى الوظيفي'], key: 'jobTitle' },
        { labels: ['القسم', 'الإدارة'], key: 'dept' },
        { labels: ['الرقم الوظيفي'], key: 'empId' },
        { labels: ['المدير'], key: 'manager' }
    ];
    
    // First, try by data-fid (used in formsend forms)
    var inputs = activePg.querySelectorAll('input, textarea');
    inputs.forEach(function(el){
        var fid = el.getAttribute('data-fid');
        if(fid && emp[fid] !== undefined) {
            el.value = emp[fid];
        } else {
            // Try by previous label text
            var prev = el.previousElementSibling;
            if(prev && prev.tagName === 'SPAN' || prev && prev.tagName === 'LABEL') {
                var txt = prev.textContent;
                for(var i=0; i<mappings.length; i++) {
                    var match = mappings[i].labels.some(function(l){ return txt.indexOf(l) > -1; });
                    if(match && emp[mappings[i].key]) {
                        el.value = emp[mappings[i].key];
                        break;
                    }
                }
            }
        }
    });
    
    // Also try FL-line inputs
    var flItems = activePg.querySelectorAll('.FL-meta-item');
    flItems.forEach(function(item){
        var lbl = item.querySelector('.FL-meta-lbl');
        var val = item.querySelector('.FL-meta-val');
        if(lbl && val) {
            var txt = lbl.textContent;
            for(var i=0; i<mappings.length; i++) {
                var match = mappings[i].labels.some(function(l){ return txt.indexOf(l) > -1; });
                if(match && emp[mappings[i].key]) {
                    val.value = emp[mappings[i].key];
                    break;
                }
            }
        }
    });
    
    // Reset selection so it can be triggered again
    document.getElementById('tgAutoCompleteEmp').value = '';
    if(typeof tgToast === 'function') tgToast('✅ تم تعبئة البيانات تلقائياً', 'ok');
}


// ─── مسار التطوير المهني - لوحة الإدارة ────────────────────────────────────
function loadDevResAdmin(container) {
    var h = '<div class="set-sec" style="max-width:800px; margin:20px auto;">';
    h += '<div class="set-sec-title">📚 إضافة مصدر جديد لمكتبة التطوير</div>';
    h += '<div class="set-hint" style="margin-bottom:16px;">قم برفع كتاب (PDF) أو إضافة رابط فيديو من يوتيوب، ليتمكن الذكاء الاصطناعي من ترشيحه للموظفين بناءً على تخصصاتهم.</div>';
    
    h += '<div class="fg" style="margin-bottom:12px;">';
    h += '<label>عنوان المصدر (كتاب / فيديو)</label>';
    h += '<input type="text" id="devResTitle" placeholder="مثال: أساسيات التسويق الرقمي">';
    h += '</div>';

    h += '<div class="fr fr2" style="margin-bottom:12px;">';
    h += '<div class="fg" style="margin:0;"><label>نوع المصدر</label>';
    h += '<select id="devResType" onchange="toggleDevResInput(this.value)">';
    h += '<option value="book">كتاب / ملف (PDF)</option>';
    h += '<option value="video">فيديو / رابط خارجي</option>';
    h += '</select></div>';
    
    h += '<div class="fg" style="margin:0;"><label>التخصص أو المجال (اختياري)</label>';
    h += '<input type="text" id="devResTags" placeholder="مثال: تسويق، مبيعات، برمجة (مفصول بفاصلة)">';
    h += '</div></div>';

    h += '<div class="fg" id="devResFileInputContainer" style="margin-bottom:16px;">';
    h += '<label>ملف المصدر (أقصى حجم 100 ميجابايت)</label>';
    h += '<input type="file" id="devResFile" accept=".pdf,.doc,.docx,.ppt,.pptx">';
    h += '</div>';
    
    h += '<div class="fg" id="devResLinkInputContainer" style="margin-bottom:16px; display:none;">';
    h += '<label>رابط المصدر (URL)</label>';
    h += '<input type="url" id="devResLink" placeholder="https://youtube.com/...">';
    h += '</div>';

    h += '<button class="bt bt-p" onclick="addDevRes()" id="btnSaveDevRes">➕ حفظ المصدر في المكتبة</button>';
    h += '<div id="devResUploadStatus" style="margin-top:10px; font-weight:bold; color:var(--nv); font-size:12px;"></div>';
    h += '</div>';

    h += '<div class="set-sec" style="max-width:800px; margin:20px auto; background: linear-gradient(135deg, #f0f4ff 0%, #e6edff 100%); border: 1px solid #cce0ff;">';
    h += '<div class="set-sec-title">🤖 مساعد الذكاء الاصطناعي للمدير</div>';
    h += '<div class="set-hint" style="margin-bottom:12px;">لا تعرف ماذا تضيف؟ أدخل المسمى الوظيفي أو القسم، وسيقترح لك الذكاء الاصطناعي أفضل الكتب أو مواضيع الفيديوهات لتبحث عنها وتضيفها للموظفين!</div>';
    h += '<div style="display:flex; gap:8px; flex-wrap:wrap;">';
    h += '<input type="text" id="adminAiSuggestField" placeholder="مثال: مبيعات، تسويق رقمي، مطورين..." style="flex:1;">';
    h += '<button class="bt bt-d" style="background:var(--nv); color:var(--w); border:none;" onclick="adminGenerateSuggestions()" id="btnAdminSuggest">✨ اقترح مصادر لإضافتها</button>';
    h += '</div>';
    h += '<div id="adminAiSuggestResult" style="display:none; margin-top:16px; padding:16px; background:var(--w); border-radius:8px; border:1px solid var(--bd2); font-size:14px; line-height:1.6; color:var(--tx);"></div>';
    h += '</div>';

    h += '<div class="set-sec" style="max-width:800px; margin:20px auto;">';
    h += '<div class="set-sec-title">📖 المصادر المضافة حالياً</div>';
    h += '<div id="devResAdminList">⏳ جارٍ التحميل...</div>';
    h += '</div>';

    container.innerHTML = h;
    fetchDevResAdminList();
}

window.toggleDevResInput = function(type) {
    if(type === 'video') {
        document.getElementById('devResFileInputContainer').style.display = 'none';
        document.getElementById('devResLinkInputContainer').style.display = 'block';
    } else {
        document.getElementById('devResFileInputContainer').style.display = 'block';
        document.getElementById('devResLinkInputContainer').style.display = 'none';
    }
};

function notifyNewDevRes(title) {
    var msg = 'تم إضافة مصدر جديد في التطوير المهني: ' + title;
    if(typeof tgBroadcastPush === 'function') {
        tgBroadcastPush('📚 مصدر تطوير جديد', msg, 'devres', '');
    }
}

window.addDevRes = function() {
    var title = document.getElementById('devResTitle').value.trim();
    var type = document.getElementById('devResType').value;
    var tags = document.getElementById('devResTags').value.trim();
    var fileInput = document.getElementById('devResFile');
    var linkInput = document.getElementById('devResLink').value.trim();
    var btn = document.getElementById('btnSaveDevRes');
    var status = document.getElementById('devResUploadStatus');

    if(!title) { alert('يرجى إدخال عنوان المصدر'); return; }

    var data = {
        title: title,
        type: type,
        tags: tags,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if(type === 'book') {
        var file = fileInput.files[0];
        if(!file) { alert('يرجى اختيار ملف'); return; }
        if(file.size > 100*1024*1024) { alert('حجم الملف كبير جداً (يجب أن يكون أقل من 100 ميجا)'); return; }
        
        btn.disabled = true;
        status.innerText = '⏳ جارٍ رفع الملف...';
        
        tgUploadFile('dev_resources', file.name, file, 
            function(progress) {
                status.innerText = '⏳ جارٍ رفع الملف... ' + Math.round(progress) + '%';
            }, 
            function(error) {
                status.innerText = '❌ خطأ في الرفع: ' + error;
                btn.disabled = false;
            }, 
            function(url) {
                status.innerText = '⏳ جارٍ حفظ البيانات...';
                data.url = url;
                data.fileName = file.name;
                db.collection('dev_resources').add(data).then(function() {
                    status.innerText = '✅ تم الحفظ بنجاح!';
                    btn.disabled = false;
                    document.getElementById('devResTitle').value = '';
                    fileInput.value = '';
                    fetchDevResAdminList();
                    notifyNewDevRes(data.title);
                    setTimeout(function(){ status.innerText = ''; }, 3000);
                }).catch(function(err) {
                    status.innerText = '❌ خطأ في الحفظ: ' + err.message;
                    btn.disabled = false;
                });
            }
        );

    } else {
        if(!linkInput) { alert('يرجى إدخال الرابط'); return; }
        data.url = linkInput;
        
        btn.disabled = true;
        status.innerText = '⏳ جارٍ الحفظ...';
        
        db.collection('dev_resources').add(data).then(function() {
            status.innerText = '✅ تم الحفظ بنجاح!';
            btn.disabled = false;
            document.getElementById('devResTitle').value = '';
            document.getElementById('devResLink').value = '';
            fetchDevResAdminList();
            notifyNewDevRes(data.title);
            setTimeout(function(){ status.innerText = ''; }, 3000);
        }).catch(function(err) {
            status.innerText = '❌ خطأ: ' + err.message;
            btn.disabled = false;
        });
    }
};

window.fetchDevResAdminList = function() {
    var list = document.getElementById('devResAdminList');
    if(!list) return;
    list.innerHTML = '⏳ جارٍ التحميل...';
    
    db.collection('dev_resources').orderBy('createdAt', 'desc').onSnapshot(function(snap) {
        if(snap.empty) {
            list.innerHTML = '<div class="empty-hint">لا توجد مصادر مضافة بعد.</div>';
            return;
        }
        
        var h = '<table class="dt" style="width:100%"><thead><tr><th>العنوان</th><th>النوع</th><th>المجال/التخصص</th><th>الرابط</th><th>إجراء</th></tr></thead><tbody>';
        snap.forEach(function(doc) {
            var d = doc.data();
            var icon = d.type === 'video' ? '▶️ فيديو' : '📕 كتاب';
            h += '<tr>';
            h += '<td>' + escH(d.title) + '</td>';
            h += '<td>' + icon + '</td>';
            h += '<td>' + escH(d.tags || 'عام') + '</td>';
            h += '<td><a href="'+d.url+'" target="_blank" style="color:var(--nv);font-weight:bold;text-decoration:none;">فتح الرابط 🔗</a></td>';
            h += '<td><button class="bt bt-d" style="padding:2px 8px;font-size:10px;" onclick="deleteDevRes(\''+doc.id+'\', \''+(d.type==='book' ? d.url : '')+'\')">🗑 حذف</button></td>';
            h += '</tr>';
        });
        h += '</tbody></table>';
        list.innerHTML = h;
    }, function(err) {
        console.error("fetchDevResAdminList error:", err);
        list.innerHTML = '<div class="empty-hint" style="color:red">❌ تعذر التحميل: ' + err.message + '<br><small>هل قمت بتحديث قواعد Firestore؟</small></div>';
    });
};

window.deleteDevRes = function(id, fileUrl) {
    if(!confirm('هل أنت متأكد من حذف هذا المصدر؟')) return;
    
    if(fileUrl) {
        var fileRef = firebase.storage().refFromURL(fileUrl);
        fileRef.delete().catch(function(e){ console.warn("Failed to delete file:", e); });
    }
    
    db.collection('dev_resources').doc(id).delete().then(function() {
        alert('تم الحذف بنجاح');
        fetchDevResAdminList();
    }).catch(function(err) {
        alert('خطأ: ' + err.message);
    });
};


// ─── مسار التطوير المهني - لوحة الموظف ────────────────────────────────────
window.fetchEmpDevRes = function() {
    var grid = document.getElementById('empDevResGrid');
    if(!grid) return;
    grid.innerHTML = '<div class="empty-hint">⏳ جارٍ تحميل المصادر...</div>';
    
    db.collection('dev_resources').orderBy('createdAt', 'desc').onSnapshot(function(snap) {
        window._allDevRes = [];
        
        if(snap.empty) {
            grid.innerHTML = '<div class="empty-hint">لم يتم إضافة أي مصادر للمكتبة بعد.</div>';
            if(typeof updateDevResBadge === 'function') updateDevResBadge(0);
            return;
        }
        
        var h = '';
        var currentIds = [];
        snap.forEach(function(doc) {
            var d = doc.data();
            d.id = doc.id;
            currentIds.push(d.id);
            window._allDevRes.push(d);
            var isVideo = d.type === 'video';
            h += '<div style="background:var(--w); border:1px solid var(--bd2); border-radius:12px; padding:20px; transition:all 0.3s; box-shadow:0 4px 10px rgba(0,0,0,0.02); display:flex; flex-direction:column;">';
            h += '<div style="font-size:24px; margin-bottom:12px;">' + (isVideo ? '▶️' : '📕') + '</div>';
            h += '<div style="font-weight:800; font-size:16px; color:var(--tx); margin-bottom:8px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">' + escH(d.title) + '</div>';
            h += '<div style="font-size:12px; color:var(--tx3); margin-bottom:16px; flex:1;">المجال: ' + escH(d.tags || 'عام') + '</div>';
            h += '<a href="' + d.url + '" target="_blank" style="display:block; text-align:center; padding:10px; background:var(--gd); color:var(--nv); border-radius:8px; text-decoration:none; font-weight:700; transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.1);" onmouseover="this.style.opacity=\'0.8\';" onmouseout="this.style.opacity=\'1\';">' + (isVideo ? 'مشاهدة الفيديو' : 'قراءة الكتاب') + '</a>';
            h += '</div>';
        });
        grid.innerHTML = h;

        var isTabActive = document.getElementById('epg-devres') && document.getElementById('epg-devres').classList.contains('a');
        var seenDevres = JSON.parse(localStorage.getItem('seen_devres_'+(window.TG_USER ? window.TG_USER.uid : '')) || '[]');
        if (isTabActive) {
            currentIds.forEach(function(id){
                if(seenDevres.indexOf(id)===-1) seenDevres.push(id);
            });
            localStorage.setItem('seen_devres_'+(window.TG_USER ? window.TG_USER.uid : ''), JSON.stringify(seenDevres));
        }
        var unseenCount = 0;
        currentIds.forEach(function(id){
            if(seenDevres.indexOf(id)===-1) unseenCount++;
        });
        if (typeof updateDevResBadge === 'function') updateDevResBadge(unseenCount);

    }, function(err){
        console.error("fetchEmpDevRes error:", err);
        grid.innerHTML = '<div class="empty-hint" style="color:red">❌ تعذر التحميل: ' + err.message + '</div>';
    });
};


async function buildCompanyContextForAi(promptText) {
    try {
    promptText = promptText || "";
    var ctx = "معلومات عن الشركة لتكون في السياق عند الإجابة:\n";
    if (window._appSettingsCache && window._appSettingsCache.companyName) {
        ctx += "اسم الشركة: " + window._appSettingsCache.companyName + "\n";
    } else {
        ctx += "اسم الشركة: الشركة الخاصة بنا\n";
    }
    
    if (!window._pmgmtProjCache && window.auth && window.auth.currentUser && window.db) {
        try {
            // According to the new RAG requirements, AI should know ALL projects even if queried by an employee.
            var snap = await db.collection('projects').get();
            window._pmgmtProjCache = [];
            snap.forEach(function(d){ var data = d.data(); data.id = d.id; window._pmgmtProjCache.push(data); });
        } catch(e) { console.error("Error loading projects for AI context", e); }
    }

    if (!window._staffEmpCache && window.auth && window.auth.currentUser && window.db) {
        try {
            var snap = await db.collection('users').get();
            window._staffEmpCache = [];
            snap.forEach(function(d){ var data = d.data(); data.uid = d.id; window._staffEmpCache.push(data); });
        } catch(e) { console.error("Error loading employees for AI context", e); }
    }

    // Add Projects Context
    if (window._pmgmtProjCache && window._pmgmtProjCache.length > 0) {
        ctx += "\nالمشاريع الحالية في الشركة:\n";
        var activeProjects = window._pmgmtProjCache.filter(function(p){ return p.status !== 'مكتمل'; });
        for(var i=0; i<Math.min(activeProjects.length, 15); i++) {
            var p = activeProjects[i];
            var assigneesStr = "";
            if (p.assignees && p.assignees.length > 0 && window._staffEmpCache) {
                var names = [];
                p.assignees.forEach(function(uid) {
                    var e = window._staffEmpCache.find(x => x.uid === uid);
                    if(e) names.push(e.name.split(' ')[0]);
                });
                if(names.length > 0) assigneesStr = " | الفريق: " + names.join(', ');
            }
            ctx += "- " + (p.title || 'بدون اسم') + " (الحالة: " + (p.status || 'قيد التنفيذ') + ")" + assigneesStr + "\n";
        }
    }

    // Add Employees Context
    if (window._staffEmpCache && window._staffEmpCache.length > 0) {
        ctx += "\nالموظفون الحاليون (أسماء ومناصب):\n";
        for(var i=0; i<Math.min(window._staffEmpCache.length, 30); i++) {
            var e = window._staffEmpCache[i];
            var roleStr = e.role === 'admin' ? 'مدير نظام' : (e.role === 'manager' ? 'مدير' : 'موظف');
            var levelStr = e.level || '';
            var deptStr = e.department || '';
            ctx += "- " + (e.name || 'غير معروف') + " (" + roleStr + (deptStr ? " قسم " + deptStr : "") + (levelStr ? " مستوى " + levelStr : "") + ")\n";
        }
    }
    
    ctx += "\nملاحظة: استخدم هذه المعلومات فقط إذا كان سؤال المستخدم يتعلق بها أو إذا كانت ستساعد في تقديم مسار مهني أو نصيحة أفضل داخل سياق شركتنا. لا تقم بسرد هذه المعلومات للمستخدم إلا إذا طلب ذلك.\n\n";
    
    // Employee Specific Check
    var specificEmployeeUid = null;
    var specificEmployeeName = "";
    if (window._staffEmpCache) {
        for(var i=0; i<window._staffEmpCache.length; i++) {
            var emp = window._staffEmpCache[i];
            if (emp.name) {
                var fName = emp.name.split(' ')[0];
                if (promptText.indexOf(emp.name) !== -1 || (fName.length > 2 && promptText.indexOf(fName) !== -1)) {
                specificEmployeeUid = emp.uid;
                specificEmployeeName = emp.name;
                ctx += "\n\n--- تقرير مفصل عن الموظف المذكور (" + emp.name + ") ---\n";
                break;
                }
            }
        }
    }
    
    if (specificEmployeeUid) {
        try {
            var snapP = await db.collection('projects').where('assignees', 'array-contains', specificEmployeeUid).get();
            ctx += "\nمشاريع الموظف:\n";
            snapP.forEach(function(d){ var p = d.data(); ctx += "- " + (p.title || 'بدون اسم') + " (" + (p.status || 'قيد التنفيذ') + ")\n"; });
            
            var snapT = await db.collection('tasks').where('assignedTo', '==', specificEmployeeUid).get();
            ctx += "\nمهام الموظف:\n";
            snapT.forEach(function(d){ var t = d.data(); ctx += "- " + (t.title || 'بدون اسم') + " (" + (t.status || 'معلقة') + ")\n"; });
            
            var snapAtt = await db.collection('attendance').where('uid', '==', specificEmployeeUid).orderBy('date', 'desc').limit(7).get();
            ctx += "\nسجل الحضور الأخير:\n";
            snapAtt.forEach(function(d){ var a = d.data(); ctx += "- " + a.date + " (حضور: " + (a.timeIn || 'لا يوجد') + ", انصراف: " + (a.timeOut || 'لا يوجد') + ")\n"; });
            
            var snapWkr = await db.collection('weekly_reports').where('uid', '==', specificEmployeeUid).orderBy('timestamp', 'desc').limit(2).get();
            ctx += "\nأحدث التقارير الأسبوعية:\n";
            snapWkr.forEach(function(d){ var r = d.data(); ctx += "- من " + r.startDate + " إلى " + r.endDate + ": المنجز (" + (r.completedTasks||'') + ")\n"; });
        } catch(e) { console.error("Error fetching specific emp data", e); }
    }

    return ctx;
    } catch (err) {
        console.error("AI Context Error:", err);
        return promptText || "";
    }
}

// ─── المستشار الذكي (Admin AI Advisor Chat) ────────────────────────────────
function tgTruncateText(s, len) {
    s = (s || '').toString().trim();
    if (s.length <= len) return s;
    return s.slice(0, len) + '…';
}

async function buildAdvisorLiveContext(questionText) {
    questionText = questionText || "";
    var ctx = "";
    try { ctx = await buildCompanyContextForAi(questionText); } catch(e) { ctx = ""; }

    ctx += "\n\n--- البيانات الإدارية الحية التفصيلية الشاملة (استخدمها للإجابة بدقة كاملة) ---\n";

    // الطلبات المعلقة
    try {
        var reqSnap = await db.collection('requests').where('status','==','pending').get();
        ctx += "\n📋 الطلبات المعلقة حالياً (" + reqSnap.size + "):\n";
        if (reqSnap.size === 0) ctx += "لا توجد طلبات معلقة.\n";
        reqSnap.forEach(function(d) {
            var r = d.data();
            var empMatch = (window._staffEmpCache || []).find(function(e){ return e.uid === r.uid; });
            var empName = empMatch ? empMatch.name : (r.uid || 'غير معروف');
            ctx += "- " + (r.type || 'طلب') + " من " + empName + (r.fromDate ? (" بتاريخ " + r.fromDate + (r.toDate ? (" إلى " + r.toDate) : "")) : "") + "\n";
        });
    } catch(e) { console.error("Advisor ctx (requests) error", e); }

    // المهام والمشاريع (كافة المهام الجارية والمهام المتأخرة)
    try {
        var taskSnap = await db.collection('tasks').get();
        var allTasks = [];
        var overdueTasks = [];
        taskSnap.forEach(function(d) {
            var t = d.data();
            var empMatch = (window._staffEmpCache || []).find(function(e){ return e.uid === t.assignedTo; });
            var empName = empMatch ? empMatch.name : 'غير مخصص';
            var taskStr = (t.title || 'مهمة بدون اسم') + " [المسؤول: " + empName + " | الحالة: " + (t.status || 'معلقة') + (t.deadline ? (" | الموعد: " + t.deadline) : "") + "]";
            allTasks.push(taskStr);
            if (typeof isOverdue === 'function' && isOverdue(t.deadline, t.status)) {
                overdueTasks.push(taskStr);
            }
        });
        ctx += "\n🎯 كافة مهام النظام (" + allTasks.length + " مهمة):\n";
        if (allTasks.length === 0) ctx += "لا توجد مهام مسجلة.\n";
        else allTasks.slice(0, 35).forEach(function(x){ ctx += "- " + x + "\n"; });

        if (overdueTasks.length > 0) {
            ctx += "\n⚠️ المهام المتأخرة عن موعدها (" + overdueTasks.length + "):\n";
            overdueTasks.slice(0, 20).forEach(function(x){ ctx += "- " + x + "\n"; });
        }

        var overdueProjs = (window._pmgmtProjCache || []).filter(function(p) {
            return typeof isOverdue === 'function' && isOverdue(p.deadline, p.status);
        });
        if (overdueProjs.length > 0) {
            ctx += "\n⚠️ المشاريع المتأخرة عن موعدها (" + overdueProjs.length + "):\n";
            overdueProjs.forEach(function(p){ ctx += "- " + (p.title || 'بدون اسم') + " (مستحق في " + p.deadline + ")\n"; });
        }
    } catch(e) { console.error("Advisor ctx (tasks/projects) error", e); }

    // حضور اليوم
    try {
        var today = new Date().toISOString().split('T')[0];
        var attSnap = await db.collection('attendance').where('date','==',today).get();
        var presentUids = {};
        attSnap.forEach(function(d){ var a = d.data(); if(a.uid) presentUids[a.uid] = true; });
        var staffList = (window._staffEmpCache || []).filter(function(e){ return e.role !== 'admin'; });
        var presentCount = 0;
        var absentNames = [];
        staffList.forEach(function(e) {
            if (presentUids[e.uid]) presentCount++;
            else absentNames.push(e.name);
        });
        ctx += "\n⏱ حضور اليوم (" + today + "): حضر " + presentCount + " من أصل " + staffList.length + " موظف.\n";
        if (absentNames.length > 0 && absentNames.length <= 25) {
            ctx += "الموظفون الذين لم يسجلوا حضور اليوم بعد: " + absentNames.join('، ') + "\n";
        }
    } catch(e) { console.error("Advisor ctx (attendance) error", e); }

    // التقارير الأسبوعية (شاملة المهام والخطط القادمة)
    try {
        var wr1 = await db.collection('weekly_reports').orderBy('createdAt','desc').limit(15).get().catch(function(){ return {docs:[]}; });
        var wr2 = await db.collection('weeklyReports').orderBy('createdAt','desc').limit(15).get().catch(function(){ return {docs:[]}; });
        var wrDocs = (wr1.docs || []).concat(wr2.docs || []);
        if (wrDocs.length > 0) {
            ctx += "\n📝 أحدث التقارير الأسبوعية المُرسلة (" + wrDocs.length + "):\n";
            wrDocs.slice(0, 20).forEach(function(d) {
                var r = d.data();
                var empMatch = (window._staffEmpCache || []).find(function(e){ return e.uid === r.uid; });
                var empName = empMatch ? empMatch.name : (r.userName || r.creatorName || r.uid || 'غير معروف');
                var datesStr = r.startDate ? (" (من " + r.startDate + (r.endDate ? (" إلى " + r.endDate) : "") + ")") : "";
                ctx += "\n- تقرير " + empName + datesStr + ":\n";
                if (r.completedTasks || r.achievements) ctx += "  * المنجز: " + tgTruncateText(r.completedTasks || r.achievements, 350) + "\n";
                if (r.nextWeekPlan || r.plannedTasks || r.nextTasks) ctx += "  * خطة الأسبوع القادم: " + tgTruncateText(r.nextWeekPlan || r.plannedTasks || r.nextTasks, 350) + "\n";
                if (r.challenges && r.challenges !== 'لا يوجد') ctx += "  * التحديات: " + tgTruncateText(r.challenges, 250) + "\n";
            });
        }
    } catch(e) { console.error("Advisor ctx (weekly reports) error", e); }

    // التقارير الشهرية
    try {
        var mrSnap = await db.collection('monthly_reports').orderBy('createdAt','desc').limit(15).get();
        if (!mrSnap.empty) {
            ctx += "\n📊 أحدث التقارير الشهرية (" + mrSnap.size + "):\n";
            mrSnap.forEach(function(d) {
                var r = d.data();
                var empMatch = (window._staffEmpCache || []).find(function(e){ return e.uid === r.uid; });
                var empName = empMatch ? empMatch.name : (r.userName || r.creatorName || 'غير معروف');
                ctx += "\n- تقرير " + empName + " (" + (r.monthYear || '') + "):\n";
                if (r.achievements) ctx += "  * الإنجازات: " + tgTruncateText(r.achievements, 400) + "\n";
                if (r.nextMonthPlan || r.goals) ctx += "  * أهداف الشهر القادم: " + tgTruncateText(r.nextMonthPlan || r.goals, 400) + "\n";
                if (r.challenges && r.challenges !== 'لا يوجد') ctx += "  * التحديات: " + tgTruncateText(r.challenges, 300) + "\n";
            });
        }
    } catch(e) { console.error("Advisor ctx (monthly reports) error", e); }

    // الخطط الشهرية المفصلة بالكامل (الأهداف + المهام + نسبة الإنجاز)
    try {
        var mpSnap = await db.collection('monthly_plans').orderBy('createdAt','desc').limit(30).get();
        if (!mpSnap.empty) {
            ctx += "\n🎯 الخطط الشهرية المسجلة وتفاصيلها الكاملة (" + mpSnap.size + " خطة):\n";
            mpSnap.forEach(function(d) {
                var p = d.data();
                var empMatch = (window._staffEmpCache || []).find(function(e){ return e.uid === p.uid || e.uid === p.createdBy; });
                var empName = empMatch ? empMatch.name : (p.creatorName || p.userName || 'غير معروف');
                var titleStr = p.title ? (" — " + p.title) : "";
                var mStr = p.monthYear ? (" [شهر: " + p.monthYear + "]") : "";
                var progStr = " | نسبة الإنجاز: " + (p.progress || 0) + "% (الحالة: " + (p.status || 'معلقة') + ")";
                
                ctx += "\n📌 خطة الموظف: " + empName + mStr + titleStr + progStr + "\n";
                if (p.objectives) {
                    var objText = typeof p.objectives === 'string' ? p.objectives : JSON.stringify(p.objectives);
                    ctx += "   - الأهداف الرئيسية: " + tgTruncateText(objText, 600) + "\n";
                }
                if (p.tasks) {
                    var tasksText = "";
                    if (Array.isArray(p.tasks)) {
                        tasksText = p.tasks.map(function(t, idx){ 
                            if (typeof t === 'string') return (idx+1) + ". " + t;
                            var tTitle = t.title || t.name || t.task || JSON.stringify(t);
                            return (idx+1) + ". " + tTitle + (t.done ? " [تم الإنجاز]" : "");
                        }).join(" ؛ ");
                    } else {
                        tasksText = p.tasks.toString();
                    }
                    ctx += "   - المهام والخطوات التفصيلية: " + tgTruncateText(tasksText, 1000) + "\n";
                }
            });
        }
    } catch(e) { console.error("Advisor ctx (monthly plans) error", e); }

    // الإنجازات
    try {
        var achSnap = await db.collection('achievements').orderBy('createdAt','desc').limit(15).get();
        if (!achSnap.empty) {
            ctx += "\n🏆 أحدث الإنجازات المسجلة (" + achSnap.size + "):\n";
            achSnap.forEach(function(d) {
                var a = d.data();
                var empMatch = (window._staffEmpCache || []).find(function(e){ return e.uid === a.uid; });
                ctx += "- " + (empMatch ? empMatch.name : (a.uid || 'غير معروف')) + ": " + tgTruncateText(a.title || a.description || '', 150) + "\n";
            });
        }
    } catch(e) { console.error("Advisor ctx (achievements) error", e); }

    // الإعلانات الداخلية
    try {
        var annSnap = await db.collection('announcements').orderBy('createdAt','desc').limit(10).get();
        if (!annSnap.empty) {
            ctx += "\n📢 أحدث الإعلانات الداخلية (" + annSnap.size + "):\n";
            annSnap.forEach(function(d) {
                var a = d.data();
                ctx += "- " + tgTruncateText(a.title || a.text || a.content || '', 200) + "\n";
            });
        }
    } catch(e) { console.error("Advisor ctx (announcements) error", e); }

    // قاعدة معرفة المستشار (المستندات المرفوعة)
    try {
        var kbSnap = await db.collection('aiKnowledgeDocs').orderBy('createdAt','desc').get();
        if (!kbSnap.empty) {
            ctx += "\n📁 المستندات المتاحة في قاعدة معرفة المستشار (" + kbSnap.size + "):\n";
            var allDocs = [];
            kbSnap.forEach(function(d) {
                var doc = d.data();
                allDocs.push(doc);
                ctx += "- " + doc.title + " (" + (doc.charCount || 0) + " حرف)\n";
            });

            // تضمين جميع المستندات أو المطابقة لأسئلة المستخدم
            var matchedDocs = allDocs.filter(function(doc) {
                if (!doc.title) return false;
                var t = doc.title.toLowerCase();
                var q = questionText.toLowerCase();
                return q.indexOf(t) !== -1 || t.split(/\s+/).some(function(w){ return w.length > 2 && q.indexOf(w) !== -1; });
            });

            // لو مفيش مطابقة مباشرة أو كان عدد المستندات قليل (أقل من 8)، أرفق المحتوى كاملاً لكل المستندات
            if (matchedDocs.length === 0 || allDocs.length <= 8) {
                matchedDocs = allDocs;
            }

            if (matchedDocs.length > 0) {
                ctx += "\n--- محتوى مستندات قاعدة المعرفة المرفوعة (استخدمه للإجابة بدقة وحكمة) ---\n";
                matchedDocs.slice(0, 6).forEach(function(doc) {
                    ctx += "\n### مستند: " + doc.title + "\n" + (doc.text || '').slice(0, 25000) + "\n";
                });
            }
        }
    } catch(e) { console.error("Advisor ctx (knowledge docs) error", e); }

    ctx += "\n\nتعليمات هامة جداً للمستشار:\n" +
           "1. أنت 'المستشار الذكي الشامل' الخاص بنظام Tech Go لإدارة الشركة والموظفين.\n" +
           "2. بين يديك الآن البيانات الكاملة والتفصيلية المحدثة للشركة: قائمة الموظفين والمناصب، المهام والمشاريع، الحضور والانصراف، الطلبات المعلقة، التقارير الأسبوعية والشهرية، الإنجازات، والخطط الشهرية التفصيلية كاملة بأهدافها ومهامها ونسب إنجازها، بالإضافة لكافة المستندات المرفوعة في قاعدة المعرفة.\n" +
           "3. عندما يسألك المستخدم عن خطط أي شهر (مثل شهر 8 أو شهر أغسطس أو غيره)، اعرض تفاصيل خطط الموظفين المتاحة وأهدافهم ومهامهم ونسب إنجازهم بوضوح واستفاضة من البيانات أعلاه، ولا تقل أبداً إن 'المعلومات التفصيلية غير موجودة'.\n" +
           "4. أجب بدقة ووضوح وبطريقة احترافية ومفيدة باللهجة المصرية، وساعد المدير دائماً برؤية تحليليّة وإدارية حكيمة.\n";
    return ctx;
}

function aiAdvisorCallAPI(apiKey, contextText, historyArr) {
    return new Promise(function(resolve, reject) {
        if (!apiKey) { reject(new Error('مفتاح API غير موجود.')); return; }
        var isGroq = apiKey.indexOf('gsk_') === 0;
        var isOpenRouter = apiKey.indexOf('sk-or-') === 0;

        if (isGroq || isOpenRouter) {
            var endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
            var modelName = isGroq ? 'llama-3.3-70b-versatile' : 'meta-llama/llama-3.1-8b-instruct:free';
            var messages = [{ role: 'system', content: contextText }];
            historyArr.forEach(function(m) { messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }); });

            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + apiKey,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Tech Go System - AI Advisor'
                },
                body: JSON.stringify({ model: modelName, messages: messages, temperature: 0.6 })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.error) {
                    var msg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
                    reject(new Error(msg));
                    return;
                }
                if (data.choices && data.choices.length > 0) resolve(data.choices[0].message.content);
                else reject(new Error('رد فارغ من الخادم.'));
            })
            .catch(reject);
            return;
        }

        // Gemini (default) - discover available models dynamically for this key, like callGemini() does
        var contents = [];
        historyArr.forEach(function(m) { contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }); });

        var lastErr = null;
        function tryModel(modelsToTry, idx) {
            if (idx >= modelsToTry.length) { reject(lastErr || new Error('تعذر الاتصال بأي نموذج Gemini متاح.')); return; }
            fetch('https://generativelanguage.googleapis.com/v1beta/' + modelsToTry[idx] + ':generateContent?key=' + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemInstruction: { parts: [{ text: contextText }] }, contents: contents })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.error) {
                    var errMsg = data.error.message || 'خطأ من Gemini';
                    if (errMsg.toLowerCase().indexOf('quota') !== -1 && errMsg.indexOf('limit: 0') !== -1) {
                        reject(new Error('حساب Google المرتبط بمفتاح الـ API ده مالوش أي رصيد مجاني حالياً (Limit: 0) — ده غالباً بيحصل لو حساب Google في دولة مش مدعومة بالباقة المجانية، أو محتاج تفعيل الفوترة. الحل الأسرع: جيب مفتاح Groq المجاني من console.groq.com وحطه بدل مفتاح Gemini في إعدادات النظام (نفس الخانة، بيتعرف تلقائي).'));
                        return;
                    }
                    if (errMsg.toLowerCase().indexOf('quota') !== -1 || errMsg.indexOf('429') !== -1) {
                        lastErr = new Error('تم الوصول للحد الأقصى من الطلبات المجانية المسموحة حالياً لهذا المفتاح. يرجى الانتظار دقيقة والمحاولة مرة أخرى.');
                        tryModel(modelsToTry, idx + 1);
                        return;
                    }
                    lastErr = new Error(errMsg);
                    tryModel(modelsToTry, idx + 1);
                    return;
                }
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    resolve(data.candidates[0].content.parts[0].text);
                } else {
                    lastErr = new Error('رد فارغ من ' + modelsToTry[idx]);
                    tryModel(modelsToTry, idx + 1);
                }
            })
            .catch(function(err) { lastErr = err; tryModel(modelsToTry, idx + 1); });
        }

        fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.error) { reject(new Error("ListModels Error: " + data.error.message)); return; }
            var models = data.models || [];
            var flashLite = null, flash = null, pro = null, other = null;
            for (var i = 0; i < models.length; i++) {
                var m = models[i];
                if (!m.supportedGenerationMethods || m.supportedGenerationMethods.indexOf('generateContent') === -1) continue;
                if (m.name.indexOf('vision') !== -1 || m.name.indexOf('exp') !== -1 || m.name.indexOf('embedding') !== -1) continue;
                if (!flashLite && m.name.indexOf('flash-lite') !== -1) flashLite = m.name;
                else if (!flash && m.name.indexOf('flash') !== -1) flash = m.name;
                else if (!pro && m.name.indexOf('pro') !== -1) pro = m.name;
                else if (!other) other = m.name;
            }
            var candidates = [flash, flashLite, pro, other].filter(Boolean);
            if (candidates.length === 0) { reject(new Error("لا توجد نماذج نصية مدعومة لهذا المفتاح.")); return; }
            tryModel(candidates, 0);
        })
        .catch(function(err) { reject(err); });
    });
}

window._aiAdvChips = [
    { label: '📋 الطلبات المعلقة', q: 'اديني ملخص سريع عن كل الطلبات المعلقة حالياً ومين مقدمها.' },
    { label: '⏱ حضور اليوم', q: 'إيه وضع الحضور والانصراف النهاردة؟ مين المتأخر أو الغايب؟' },
    { label: '📁 مشاريع ومهام متأخرة', q: 'فيه مشاريع أو مهام متأخرة عن موعدها؟ وضحلي التفاصيل.' },
    { label: '💡 اقتراحات تحسين', q: 'بناءً على البيانات الحالية، اقترح لي 3 خطوات عملية لتحسين أداء الفريق الأسبوع ده.' }
];

function loadAiAdvisor(c) {
    var apiKey = window._appSettingsCache && window._appSettingsCache.geminiApiKey;
    var h = '<div class="set-sec" style="max-width:900px; margin:20px auto;">';
    h += '<div class="set-sec-title">🧠 المستشار الذكي</div>';
    h += '<div class="set-hint" style="margin-bottom:16px;">اسأل عن أي حاجة في الشركة: الموظفين، المشاريع، الطلبات المعلقة، الحضور، أو اطلب اقتراحات إدارية — والمستشار هيرد عليك من بيانات النظام الحقيقية.</div>';

    if (!apiKey) {
        h += '<div style="padding:24px 16px; background:#faf5ff; border:1px solid #e9d5ff; border-radius:10px; text-align:center;">';
        h += '<div style="font-size:34px; margin-bottom:8px;">🔑</div>';
        h += '<div style="font-weight:800; color:var(--nv); margin-bottom:6px;">لسه محتاج تفعّل الميزة دي</div>';
        h += '<div style="color:var(--tx3); font-size:13px; margin-bottom:14px; max-width:420px; margin-inline:auto;">أضف مفتاح Gemini (أو Groq / OpenRouter) — مجاني بالكامل — من إعدادات النظام عشان المستشار الذكي يبدأ يشتغل.</div>';
        h += '<button class="bt bt-p" onclick="go(\'set\')">⚙️ روح لإعدادات النظام</button>';
        h += '</div></div>';
        c.innerHTML = h;
        return;
    }

    h += '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">';
    window._aiAdvChips.forEach(function(chip, idx) {
        h += '<button class="bt bt-o" style="font-size:12px; padding:6px 12px;" onclick="aiAdvSendChip(' + idx + ')">' + chip.label + '</button>';
    });
    h += '</div>';

    h += '<div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:10px; padding:14px 16px; margin-bottom:16px;">';
    h += '<div style="font-weight:800; color:var(--nv); font-size:13.5px; margin-bottom:4px;">📎 غذّي المستشار بالملفات والمستندات (PDF, TXT, MD, CSV)</div>';
    h += '<div style="color:var(--tx3); font-size:12px; margin-bottom:10px;">ارفع تقارير أو خطط أو مستندات نصية (PDF أو TXT أو MD أو CSV أو JSON)، والمستشار هيحلل محتواها ويقدر يرد عليك من جواه لما تسأل باسم المستند.</div>';
    h += '<div class="fr fr2" style="margin-bottom:10px;">';
    h += '<div class="fg" style="margin:0;"><label>عنوان المستند</label><input type="text" id="aiKbTitle" placeholder="مثال: خطة الربع الأول 2026 أو تقرير الحضور"></div>';
    h += '<div class="fg" style="margin:0;"><label>اختر الملف (PDF, TXT, MD, CSV, إلخ)</label><input type="file" id="aiKbFile" accept=".pdf,.txt,.md,.markdown,.text,.json,.csv,.log,.html,.xml,application/pdf,text/plain,text/markdown,text/csv,application/json" onchange="if(this.files[0] && !document.getElementById(\'aiKbTitle\').value){ document.getElementById(\'aiKbTitle\').value = this.files[0].name.replace(/\\.[^/.]+$/, \'\'); }"></div>';
    h += '</div>';
    h += '<button class="bt bt-p" onclick="aiKbUpload()" id="aiKbUploadBtn">⬆️ رفع وتحليل الملف</button>';
    h += '<div id="aiKbUploadStatus" style="margin-top:8px; font-size:12px; font-weight:700; color:var(--nv);"></div>';
    h += '<div id="aiKbDocsList" style="margin-top:12px;">⏳ جارٍ تحميل المستندات...</div>';
    h += '</div>';

    h += '<div id="aiAdvChatBody" style="background:var(--w); border:1px solid var(--bd2); border-radius:10px; padding:16px; height:420px; overflow-y:auto; margin-bottom:12px; display:flex; flex-direction:column; gap:12px;">';
    h += '<div style="align-self:flex-start; max-width:80%; background:#f1f5f9; padding:10px 14px; border-radius:12px 12px 12px 2px; font-size:13px; color:var(--tx);">أهلاً 👋 أنا المستشار الذكي بتاع النظام. اسألني عن أي حاجة في الشركة (موظفين، مشاريع، طلبات، حضور، تقارير، خطط، أو أي مستند رفعته لي) وهرد عليك من البيانات الفعلية.</div>';
    h += '</div>';

    h += '<div style="display:flex; gap:8px;">';
    h += '<textarea id="aiAdvInput" rows="2" placeholder="اكتب سؤالك هنا... مثال: مين الموظفين المتأخرين في التقارير الأسبوعية؟" style="flex:1; resize:none; padding:10px; border-radius:8px; border:1px solid var(--bd2); font-family:inherit; font-size:13px;" onkeydown="if(event.key===\'Enter\' && !event.shiftKey){event.preventDefault(); aiAdvSend();}"></textarea>';
    h += '<button class="bt bt-p" id="aiAdvSendBtn" onclick="aiAdvSend()" style="align-self:flex-end;">إرسال ↩</button>';
    h += '</div>';

    h += '</div>';
    c.innerHTML = h;
    window._aiAdvHistory = [];
    fetchAiKbList();
}

// ─── قاعدة معرفة المستشار: قراءة وتحليل الملفات والمستندات (PDF / TXT / MD) ──────────────
async function tgExtractPdfText(file) {
    if (typeof pdfjsLib === 'undefined') throw new Error('مكتبة قراءة PDF لم تُحمَّل بعد، حاول تحدّث الصفحة.');
    var arrayBuffer = await file.arrayBuffer();
    var pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var fullText = '';
    var maxPages = Math.min(pdf.numPages, 300);
    for (var i = 1; i <= maxPages; i++) {
        var page = await pdf.getPage(i);
        var content = await page.getTextContent();
        var pageText = content.items.map(function(it){ return it.str; }).join(' ');
        fullText += pageText + '\n\n';
        if (fullText.length > 250000) { fullText += '\n[...تم اقتصاص باقي الملف لأنه طويل جداً...]'; break; }
    }
    return fullText.trim();
}

async function tgExtractFileText(file) {
    var isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
    if (isPdf) {
        return await tgExtractPdfText(file);
    }
    // قراءة الملفات النصية المباشرة (TXT, MD, CSV, JSON, LOG, إلخ)
    try {
        var text = await file.text();
        return (text || '').trim();
    } catch(err) {
        throw new Error('تعذرت قراءة الملف النصي: ' + ((err && err.message) || err));
    }
}

window.aiKbUpload = async function() {
    var titleInput = document.getElementById('aiKbTitle');
    var fileInput = document.getElementById('aiKbFile');
    var status = document.getElementById('aiKbUploadStatus');
    var btn = document.getElementById('aiKbUploadBtn');
    if (!titleInput || !fileInput || !status || !btn) return;

    var file = fileInput.files[0];
    if (!file) { alert('يرجى اختيار ملف (PDF أو TXT أو MD أو CSV)'); return; }

    var title = titleInput.value.trim() || file.name.replace(/\.[^/.]+$/, '');
    if (file.size > 30 * 1024 * 1024) { alert('حجم الملف كبير جداً (الحد الأقصى 30 ميجابايت)'); return; }

    btn.disabled = true;
    status.innerText = '⏳ جارٍ قراءة الملف وتحليله...';

    try {
        var text = await tgExtractFileText(file);
        var isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';

        if (!text || text.length < 5) {
            if (isPdf) {
                status.innerHTML = '⚠️ لم يتم العثور على نص قابل للقراءة داخل ملف الـ PDF (قد يكون صورة ممسوحة ضوئياً).<br><span style="font-weight:normal; font-size:11.5px; color:var(--tx3); margin-top:4px; display:inline-block;">💡 نصيحة: يمكنك نسخ المحتوى أو حفظه كملف نصي (TXT أو MD) ورفعه مباشرة للمستشار.</span>';
            } else {
                status.innerText = '⚠️ الملف فارغ أو لا يحتوي على نص قابل للقراءة.';
            }
            btn.disabled = false;
            return;
        }
        var capped = text.length > 220000 ? (text.slice(0, 220000) + '\n[...تم اقتصاص الباقي...]') : text;

        function saveKbDoc(fileUrl) {
            db.collection('aiKnowledgeDocs').add({
                title: title,
                text: capped,
                charCount: capped.length,
                fileUrl: fileUrl || null,
                fileName: file.name,
                uploadedBy: (typeof TG_USER !== 'undefined' && TG_USER ? TG_USER.name : ''),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(function() {
                status.innerText = '✅ تم رفع وتحليل المستند بنجاح! (' + capped.length + ' حرف)';
                titleInput.value = '';
                fileInput.value = '';
                btn.disabled = false;
                fetchAiKbList();
                setTimeout(function(){ status.innerText = ''; }, 4000);
            }).catch(function(err2) {
                status.innerText = '❌ خطأ في الحفظ: ' + err2.message;
                btn.disabled = false;
            });
        }

        status.innerText = '⏳ جارٍ حفظ وتأكيد المستند...';
        if (typeof tgUploadFile === 'function') {
            tgUploadFile('ai_knowledge', file.name, file, null,
                function(){ saveKbDoc(null); },
                function(url){ saveKbDoc(url); }
            );
        } else {
            saveKbDoc(null);
        }
    } catch (e) {
        status.innerText = '❌ تعذرت قراءة الملف: ' + ((e && e.message) || e);
        btn.disabled = false;
    }
};

function fetchAiKbList() {
    var listEl = document.getElementById('aiKbDocsList');
    if (!listEl) return;
    listEl.innerHTML = '⏳ جارٍ التحميل...';
    db.collection('aiKnowledgeDocs').orderBy('createdAt', 'desc').get().then(function(snap) {
        if (snap.empty) { listEl.innerHTML = '<div style="color:var(--tx3); font-size:12px;">لا توجد مستندات مرفوعة بعد.</div>'; return; }
        var h = '<div style="display:flex; flex-direction:column; gap:6px;">';
        snap.forEach(function(d) {
            var doc = d.data();
            var icon = /\.pdf$/i.test(doc.fileName || '') ? '📄' : (/\.(md|markdown|txt)$/i.test(doc.fileName || '') ? '📝' : '📊');
            h += '<div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg); padding:8px 12px; border-radius:8px; font-size:12.5px;">';
            h += '<span>' + icon + ' ' + escH(doc.title) + ' <span style="color:var(--tx3);">(' + (doc.charCount || 0) + ' حرف)</span></span>';
            h += '<button class="bt bt-d" style="padding:3px 10px; font-size:11px;" onclick="aiKbDelete(\'' + d.id + '\')">🗑 حذف</button>';
            h += '</div>';
        });
        h += '</div>';
        listEl.innerHTML = h;
    }).catch(function(err) { listEl.innerHTML = '<div style="color:red; font-size:12px;">❌ ' + escH(err.message) + '</div>'; });
}

window.aiKbDelete = function(id) {
    if (!confirm('متأكد إنك عايز تحذف المستند ده من قاعدة معرفة المستشار؟')) return;
    db.collection('aiKnowledgeDocs').doc(id).delete().then(fetchAiKbList).catch(function(err){ alert('تعذر الحذف: ' + err.message); });
};

window.aiAdvSendChip = function(idx) {
    var chip = window._aiAdvChips[idx];
    if (!chip) return;
    var input = document.getElementById('aiAdvInput');
    if (input) input.value = chip.q;
    aiAdvSend();
};

window.aiAdvSend = async function() {
    var input = document.getElementById('aiAdvInput');
    var body = document.getElementById('aiAdvChatBody');
    var btn = document.getElementById('aiAdvSendBtn');
    if (!input || !body || !btn) return;

    var text = input.value.trim();
    if (!text) return;

    body.innerHTML += '<div style="align-self:flex-end; max-width:80%; background:var(--nv); color:#fff; padding:10px 14px; border-radius:12px 12px 2px 12px; font-size:13px;">' + escH(text) + '</div>';
    input.value = '';
    body.scrollTop = body.scrollHeight;

    var typingId = 'aiAdvTyping' + Date.now();
    body.innerHTML += '<div id="' + typingId + '" style="align-self:flex-start; max-width:80%; background:#f1f5f9; padding:10px 14px; border-radius:12px 12px 12px 2px; font-size:13px; color:var(--tx3);">⏳ بيفكر...</div>';
    body.scrollTop = body.scrollHeight;
    btn.disabled = true;

    window._aiAdvHistory = window._aiAdvHistory || [];
    window._aiAdvHistory.push({ role: 'user', content: text });

    try {
        var apiKey = window._appSettingsCache && window._appSettingsCache.geminiApiKey;
        var ctx = await buildAdvisorLiveContext(text);
        var replyText = await aiAdvisorCallAPI(apiKey, ctx, window._aiAdvHistory);
        window._aiAdvHistory.push({ role: 'assistant', content: replyText });
        var el = document.getElementById(typingId);
        var renderedHTML = (typeof marked !== 'undefined') ? marked.parse(replyText) : escH(replyText).replace(/\n/g, '<br>');
        if (el) el.outerHTML = '<div style="align-self:flex-start; max-width:80%; background:#f1f5f9; padding:10px 14px; border-radius:12px 12px 12px 2px; font-size:13px; color:var(--tx); line-height:1.7;">' + renderedHTML + '</div>';
    } catch (err) {
        var el2 = document.getElementById(typingId);
        if (el2) el2.outerHTML = '<div style="align-self:flex-start; max-width:80%; background:#fee2e2; color:#b91c1c; padding:10px 14px; border-radius:12px 12px 12px 2px; font-size:13px;">❌ حصل خطأ: ' + escH((err && err.message) || 'غير معروف') + '</div>';
        window._aiAdvHistory.pop();
    }
    btn.disabled = false;
    body.scrollTop = body.scrollHeight;
};

window.generateCareerPath = async function() {
    var field = document.getElementById('devResEmpField').value.trim();
    var btn = document.getElementById('btnGeneratePath');
    var resultBox = document.getElementById('aiPathResult');
    
    if(!field) {
        alert('يرجى كتابة تخصصك أو مجالك أولاً.');
        return;
    }

    var apiKey = window._appSettingsCache && window._appSettingsCache.geminiApiKey;
    if(!apiKey) {
        alert('ميزة الذكاء الاصطناعي غير مفعلة حالياً. يرجى التواصل مع الإدارة لإضافة مفتاح API.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التفكير...';
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">🤖 يقوم الذكاء الاصطناعي الآن بمعالجة طلبك واختيار أفضل المصادر...</div>';

    var resourcesText = (window._allDevRes || []).map(function(r) { return "- " + r.title + " (نوع: " + (r.type === 'video' ? 'فيديو' : 'كتاب') + ", تخصص: " + (r.tags||'عام') + ")"; }).join('\n');
    
    var prompt = (await buildCompanyContextForAi(field)) + "أنت مساعد ذكي ومستشار تطوير مهني خبير. هام جداً: إذا كان الموظف يسأل عن معلومات تخص الشركة أو الموظفين أو المشاريع، أجب عليه فوراً وبشكل مباشر من السياق المتاح لك كأنك متحدث باسم الشركة ولا تقترح مسارات مهنية. قام الموظف بإدخال النص التالي: [" + field + "].\n" +
                 "إذا كان النص عبارة عن تخصص أو مجال (مثل 'مطور ويب' أو 'محاسب')، فاقترح له مساراً تطويرياً قصيراً ومفيداً.\n" +
                 "أما إذا كان النص عبارة عن سؤال فني أو استفسار عام، فأجب عليه باحترافية وبطريقة تساعده في عمله وتطوير مهاراته.\n" +
                 "في حالة اقتراح مسارات مهنية أو إجابة أسئلة فنية، لدينا في مكتبة الشركة المصادر التالية حصراً:\n" + resourcesText + "\n\n" +
                 "يرجى كتابة ردك باللغة العربية. إذا وجدت مصادر ذات صلة في المكتبة أعلاه، اذكر عناوينها ليتمكن الموظف من العثور عليها أدناه. قدم إجابتك بتنسيق Markdown (استخدم العناوين، القوائم المنقطة، والخط العريض). ابدأ مباشرة بالرد المفيد والتحفيز.";

    callGemini(apiKey, prompt, btn, resultBox, '✨ اسأل / اقترح مساراً', false);
};

// Hook into empGo to load resources when tab is clicked
var originalEmpGo = window.empGo;
window.empGo = function(id, nav) {
    if(originalEmpGo) originalEmpGo(id, nav);
    if(id === 'devres') {
        fetchEmpDevRes();
    }
    if(id === 'livemeeting') {
        if(!window._liveMeetingInit) listenToLiveMeetingStatus();
    }
};


window.adminGenerateSuggestions = async function() {
    var field = document.getElementById('adminAiSuggestField').value.trim();
    var btn = document.getElementById('btnAdminSuggest');
    var resultBox = document.getElementById('adminAiSuggestResult');
    
    if(!field) {
        alert('يرجى إدخال التخصص أو القسم أولاً.');
        return;
    }

    var apiKey = window._appSettingsCache && window._appSettingsCache.geminiApiKey;
    if(!apiKey) {
        alert('مفتاح الذكاء الاصطناعي غير موجود في إعدادات النظام. يرجى إضافة مفتاح (Gemini أو Groq أو OpenRouter) أولاً.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '⏳ جاري التفكير...';
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">🤖 الذكاء الاصطناعي يبحث لك عن أفضل الاقتراحات...</div>';

    var prompt = (await buildCompanyContextForAi(field)) + "أنت مستشار تطوير مهني خبير. هام جداً: إذا كان المستخدم يسأل عن معلومات تخص الشركة أو الموظفين أو المشاريع، أجب عليه فوراً وبشكل مباشر من السياق المتاح لك كأنك متحدث باسم الشركة ولا تقترح مسارات أو مصادر. بصفتي مدير موارد بشرية، أريد أن أضيف مصادر تعليمية (كتب، ملفات PDF، وقنوات أو دورات يوتيوب) للموظفين في تخصص: [" + field + "].\n" +
                 "أرجو أن تقترح لي 3 إلى 5 مصادر قوية ومعروفة ومفيدة جداً في هذا المجال (يفضل باللغة العربية إن وجد، أو الإنجليزية). اكتب اسم الكتاب أو موضوع الفيديو بوضوح لكي أستطيع البحث عنه ورفعه للموظفين.\n" +
                 "قدم الاقتراحات بتنسيق Markdown وضعها في نقاط سريعة وواضحة بدون مقدمات طويلة.";

    callGemini(apiKey, prompt, btn, resultBox, '✨ اصنع مسار تطوري الآن', true);
};



function callGemini(apiKey, prompt, btn, resultBox, btnOriginalText, isAdmin) {
    if(!apiKey) {
        alert('مفتاح API مفقود.');
        return;
    }
    
    var isGroq = apiKey.startsWith('gsk_');
    var isOpenRouter = apiKey.startsWith('sk-or-');
    var isGemini = !isGroq && !isOpenRouter;

    btn.disabled = true;
    btn.innerHTML = '⏳ جاري المعالجة...';
    resultBox.style.display = 'block';
    
    var providerName = isGroq ? 'Groq' : (isOpenRouter ? 'OpenRouter' : 'Gemini');
    resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">جاري إنشاء الرد عبر ' + providerName + '...</div>';

    function renderResult(text) {
        btn.disabled = false;
        btn.innerHTML = btnOriginalText;
        var resultHTML = '';
        if(typeof marked !== 'undefined') {
            resultHTML = marked.parse(text);
        } else {
            resultHTML = '<pre style="white-space:pre-wrap; font-family:inherit;">' + escH(text) + '</pre>';
        }
        
        var actionsHTML = '<div style="margin-top:20px; padding-top:15px; border-top:1px solid #ccc; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;">';
        actionsHTML += '<button onclick="share_ai_content()" style="padding:8px 15px; font-size:14px; background-color:#2563eb; color:#ffffff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-share-alt"></i> مشاركة</button>';
        actionsHTML += '<button onclick="download_ai_content()" style="padding:8px 15px; font-size:14px; background-color:#f3f4f6; color:#1f2937; border:1px solid #d1d5db; border-radius:5px; cursor:pointer;"><i class="fa fa-file-text"></i> حفظ النص</button>';
        
        if (isAdmin) {
            actionsHTML += '<button onclick="search_ai_content_on_google()" style="padding:8px 15px; font-size:14px; background-color:#4285F4; color:#ffffff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-google"></i> البحث في جوجل</button>';
            actionsHTML += '<button onclick="jump_to_upload_resource()" style="padding:8px 15px; font-size:14px; background-color:#10B981; color:#ffffff; border:none; border-radius:5px; cursor:pointer;"><i class="fa fa-upload"></i> إضافة للمكتبة</button>';
        }
        
        actionsHTML += '</div>';
        resultBox.innerHTML = resultHTML + actionsHTML;
        window._lastAiResultText = text;
    }

    function renderError(errHtml) {
        btn.disabled = false;
        btn.innerHTML = btnOriginalText;
        resultBox.innerHTML = errHtml;
    }

    if (isGroq || isOpenRouter) {
        var endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
        var modelName = isGroq ? 'llama-3.3-70b-versatile' : 'meta-llama/llama-3.1-8b-instruct:free';
        
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'Tech Go System'
            },
            body: JSON.stringify({
                model: modelName,
                messages: [{role: "user", content: prompt}],
                temperature: 0.7
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if(data.error) {
                var msg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
                renderError('<div style="color:red; font-size:14px; text-align:right;">❌ خطأ من ' + providerName + ':<br><strong style="font-family:monospace; direction:ltr; display:block; margin-top:5px; padding:10px; background:#fdd; border-radius:5px;">' + escH(msg) + '</strong></div>');
                return;
            }
            if(data.choices && data.choices.length > 0) {
                renderResult(data.choices[0].message.content);
            } else {
                renderError('<div style="color:red; font-size:14px; text-align:right;">❌ ' + providerName + ' returned empty response.</div>');
            }
        })
        .catch(function(err) {
            renderError('<div style="color:red; font-size:14px; text-align:right;">❌ فشل الاتصال بخادم ' + providerName + ':<br><strong style="font-family:monospace; direction:ltr; display:block; margin-top:5px; padding:10px; background:#fdd; border-radius:5px;">' + escH(err.message) + '</strong></div>');
        });
        return;
    }

    // Default to Gemini (Previous logic)
    fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if(data.error) throw new Error("ListModels Error: " + data.error.message);
        var models = data.models || [];
        var flashModel = null;
        var pro15Model = null;
        var pro10Model = null;

        for(var i=0; i<models.length; i++) {
            var m = models[i];
            if(m.supportedGenerationMethods && m.supportedGenerationMethods.indexOf('generateContent') !== -1) {
                if (m.name.indexOf('vision') !== -1) continue;
                if (m.name.indexOf('exp') !== -1) continue;
                
                if (!flashModel && m.name.indexOf('gemini-1.5-flash') !== -1) flashModel = m.name;
                else if (!pro15Model && m.name.indexOf('gemini-1.5-pro') !== -1) pro15Model = m.name;
                else if (!pro10Model && (m.name.indexOf('gemini-1.0-pro') !== -1 || m.name.indexOf('gemini-pro') !== -1)) pro10Model = m.name;
            }
        }
        
        var selectedModels = [];
        if (flashModel) selectedModels.push(flashModel);
        if (pro10Model) selectedModels.push(pro10Model);
        if (pro15Model) selectedModels.push(pro15Model);

        if (selectedModels.length === 0) throw new Error("No supported text generation models found for this API key.");

        var lastErrorMsg = "";
        
        function tryModel(index) {
            if(index >= selectedModels.length) {
                renderError('<div style="color:red; font-size:14px; text-align:right;">❌ عذراً، فشل الاتصال بجميع النماذج. تفاصيل الخطأ:<br><strong style="font-family:monospace; direction:ltr; display:block; margin-top:5px; padding:10px; background:#fdd; border-radius:5px;">' + escH(lastErrorMsg) + '</strong></div>');
                return;
            }
            var targetModel = selectedModels[index];
            resultBox.innerHTML = '<div style="text-align:center; color:var(--tx2);">جاري إنشاء الرد عبر Gemini (' + targetModel.replace('models/','') + ')...</div>';
            
            fetch('https://generativelanguage.googleapis.com/v1beta/' + targetModel + ':generateContent?key=' + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if(data.error) {
                    var errMsg = data.error.message || "";
                    if (errMsg.toLowerCase().indexOf('quota') !== -1 || errMsg.indexOf('429') !== -1) {
                        if (errMsg.indexOf('limit: 0') !== -1) {
                            renderError('<div style="color:#dc2626; font-size:15px; text-align:center; padding:15px; background-color:#fee2e2; border-radius:8px; border: 1px solid #f87171;">❌ <b>تم إيقاف مفتاح API الخاص بك من قِبل جوجل:</b><br>حسابك لا يملك أي رصيد مجاني (Limit: 0). يحدث هذا إذا كان حسابك في دولة لا تدعم الباقة المجانية (مثل أوروبا)، أو تم استنفاد الحصة بالكامل. <b>يجب إنشاء مفتاح جديد من حساب آخر يدعم الخطة المجانية، أو تفعيل الدفع في حسابك.</b></div>');
                        } else {
                            renderError('<div style="color:#eab308; font-size:15px; text-align:center; padding:15px; background-color:#fef08a; border-radius:8px; border: 1px solid #facc15;">⏳ <b>تنبيه:</b> لقد وصلت للحد الأقصى من الطلبات المجانية المسموحة في الدقيقة لمفتاح API الخاص بك.<br>يُرجى الانتظار لمدة <b>دقيقة واحدة</b> ثم المحاولة مجدداً.</div>');
                        }
                        return;
                    }
                    lastErrorMsg = targetModel + " Error: " + errMsg;
                    tryModel(index + 1);
                    return;
                }
                if(!data.candidates || !data.candidates[0].content) {
                    lastErrorMsg = targetModel + " returned empty response.";
                    tryModel(index + 1);
                    return;
                }
                renderResult(data.candidates[0].content.parts[0].text);
            })
            .catch(function(err) {
                lastErrorMsg = "Fetch error: " + err.message;
                tryModel(index + 1);
            });
        }
        
        tryModel(0);
    })
    .catch(function(err) {
        renderError('<div style="color:red; font-size:14px; text-align:right;">❌ خطأ أولي من Gemini:<br><strong style="font-family:monospace; direction:ltr; display:block; margin-top:5px; padding:10px; background:#fdd; border-radius:5px;">' + escH(err.message) + '</strong></div>');
    });
};

function copyToClipboardFallback() {
    if(navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window._lastAiResultText).then(function() {
            alert('تم نسخ النص إلى الحافظة بنجاح! يمكنك الآن لصقه في أي محادثة لمشاركته مع فريقك.');
        }).catch(function(err) {
            alert('فشل النسخ: ' + err);
        });
    } else {
        alert('المتصفح الخاص بك لا يدعم المشاركة المباشرة.');
    }
}


window.search_ai_content_on_google = function() {
    var field = document.getElementById('adminAiSuggestField') ? document.getElementById('adminAiSuggestField').value : '';
    var query = encodeURIComponent("كتاب عن " + field + " PDF مجانا");
    window.open("https://www.google.com/search?q=" + query, "_blank");
};

window.jump_to_upload_resource = function() {
    var titleInput = document.getElementById('devResTitle');
    if (titleInput) {
        titleInput.focus();
        titleInput.scrollIntoView({behavior: "smooth", block: "center"});
    }
    alert('قم بنسخ اسم الكتاب الذي أعجبك من الاقتراحات والصقه في عنوان إضافة مصدر لرفعه.');
};

window.download_ai_content = function() {
    if(!window._lastAiResultText) return;
    var blob = new Blob([window._lastAiResultText], {type: "text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "اقتراحات_الذكاء_الاصطناعي.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.share_ai_content = function() {
    if(!window._lastAiResultText) return;
    if (navigator.share) {
        navigator.share({
            title: 'اقتراحات التطوير المهني',
            text: window._lastAiResultText
        }).catch(function(err){
            console.error(err);
            copyToClipboardFallback();
        });
    } else {
        copyToClipboardFallback();
    }
};



// ==================== LIVE MEETING LOGIC (JITSI) ====================
var _jitsiWindowRef = null;
var _currentRoomUrl = '';

window.reopenJitsiWindow = function() {
    if(_currentRoomUrl) {
        _jitsiWindowRef = window.open(_currentRoomUrl, 'TG_JitsiCallWindow');
        if(_jitsiWindowRef) _jitsiWindowRef.focus();
    }
};

window.cleanupStuckMeetings = async function() {
    if(!window.db) return;
    try {
        var snap = await db.collection('meetings').where('status', 'in', ['calling', 'active']).get();
        snap.forEach(function(doc) {
            db.collection('meetings').doc(doc.id).update({ status: 'ended' }).catch(function(){});
        });
        if(typeof initMeetingsListener === 'function') {
            initMeetingsListener();
        }
    } catch(e) {
        console.error("Error cleaning up meetings:", e);
    }
};

window.cancelOutgoingCall = function() {
    if (typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
    var modal = document.getElementById('outgoingMeetingModal');
    if(modal) modal.style.display = 'none';
    
    if(window._currentMeetingId && window.db) {
        db.collection('meetings').doc(window._currentMeetingId).update({
            status: 'ended',
            endedReason: 'cancelled_by_caller'
        }).catch(function(e){});
        window._currentMeetingId = null;
    }
};

window.startNewMeeting = async function(targetEmpId, targetEmpName, isGroup) {
    var myUid = (window.TG_USER && TG_USER.uid) ? TG_USER.uid : '';
    var myName = (window.TG_USER && (TG_USER.displayName || TG_USER.name)) ? (TG_USER.displayName || TG_USER.name) : "مستخدم";

    // 1. Busy check: Prevent calling if target or self is already in a call
    if(!isGroup && targetEmpId) {
        if (window._activeCallUsers && window._activeCallUsers.has(targetEmpId)) {
            alert(`❌ الموظف (${targetEmpName}) في مكالمة أخرى حالياً. يرجى المحاولة لاحقاً.`);
            return;
        }
        if (window._currentMeetingId) {
            alert(`❌ أنت في مكالمة بالفعل حالياً. يرجى إنهاء المكالمة الحالية أولاً.`);
            return;
        }
    }
    
    var topic = isGroup ? "اجتماع جماعي" : `مكالمة فردية مع ${targetEmpName}`;
    var roomName = "TechGo_" + Date.now() + "_" + Math.floor(Math.random()*1000);
    var roomUrl = `https://meet.ffmuc.net/${roomName}#config.prejoinPageEnabled=false`;
    _currentRoomUrl = roomUrl;

    try {
        // Auto-end any old stuck calls between these two users before starting a new one
        if (!isGroup && window.db) {
            try {
                var oldSnap = await db.collection('meetings').where('status', 'in', ['calling', 'active']).get();
                oldSnap.forEach(function(oldDoc) {
                    var d = oldDoc.data();
                    if ((d.createdBy === myUid && d.targetUid === targetEmpId) ||
                        (d.createdBy === targetEmpId && d.targetUid === myUid)) {
                        db.collection('meetings').doc(oldDoc.id).update({ status: 'ended' }).catch(function(){});
                    }
                });
            } catch(err) {}
        }
        
        var meetingData = {
            roomName: roomName,
            topic: topic,
            isGroup: isGroup,
            createdBy: myUid,
            createdByName: myName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'calling'
        };
        
        if(!isGroup) {
            meetingData.targetUid = targetEmpId;
            meetingData.targetName = targetEmpName;
        }
        
        var meetingRef = await db.collection('meetings').add(meetingData);
        _currentMeetingId = meetingRef.id;
        
        // Play Outgoing Ringback sound for Caller
        if (typeof playOutgoingRinging === 'function') playOutgoingRinging();

        // Show Outgoing Call Modal for Caller
        var outModal = document.getElementById('outgoingMeetingModal');
        var outText = document.getElementById('outgoingCallStatusText');
        var outTarget = document.getElementById('outgoingTargetNameText');
        var outLink = document.getElementById('outgoingDirectRoomLink');
        var outIcon = document.getElementById('outgoingCallIcon');
        var outTag = document.getElementById('outgoingCallTag');
        
        if(outIcon) outIcon.innerHTML = '📞';
        if(outTag) {
            outTag.style.cssText = 'display:inline-block; background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid rgba(59,130,246,0.4); padding:6px 18px; border-radius:30px; font-size:13px; font-weight:bold; margin-bottom:15px; letter-spacing:0.5px;';
            outTag.innerText = '📡 جاري الاتصال المباشر (رنين جارٍ 🔔)';
        }
        if(outText) outText.innerText = "جاري الاتصال...";
        if(outTarget) outTarget.innerHTML = isGroup ? `🔔 جاري رنين هاتف الموظفين...` : `🔔 جاري الرنين على: ${targetEmpName}`;
        if(outLink) outLink.href = roomUrl;
        if(outModal) outModal.style.cssText = 'display:flex !important; position:fixed; top:0; left:0; right:0; bottom:0; background:radial-gradient(circle at center, rgba(59,130,246,0.2) 0%, rgba(15,23,42,0.98) 100%); z-index:9999999; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(16px); font-family:inherit;';
        
        // Listen for status changes (accepted / rejected / ended)
        if(window._callStatusUnsubscribe) { window._callStatusUnsubscribe(); }
        window._callStatusUnsubscribe = db.collection('meetings').doc(_currentMeetingId).onSnapshot(function(doc) {
            if(!doc.exists) return;
            var d = doc.data();
            
            if(d.status === 'active') {
                if (typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
                if(outText) outText.innerText = "🟢 تم قبول المكالمة! جاري الانضمام...";
                setTimeout(function() {
                    if(outModal) outModal.style.cssText = 'display:none !important;';
                    try {
                        var callWin = window.open(roomUrl, 'TG_JitsiCallWindow');
                        if(callWin) callWin.focus();
                        _jitsiWindowRef = callWin;
                    } catch(e){}
                }, 1000);
            } else if(d.status === 'rejected') {
                if (typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
                if(outIcon) outIcon.innerHTML = '🚫';
                if(outTag) {
                    outTag.style.cssText = 'display:inline-block; background:rgba(239,68,68,0.25); color:#f87171; border:1px solid rgba(239,68,68,0.5); padding:6px 18px; border-radius:30px; font-size:13px; font-weight:bold; margin-bottom:15px;';
                    outTag.innerText = '❌ تم رفض المكالمة';
                }
                if(outText) outText.innerText = "المكالمة مرفوضة من الطرف الآخر";
                if(outTarget) outTarget.innerHTML = `<span style="color:#ef4444; text-shadow:0 2px 10px rgba(239,68,68,0.4);">❌ قام الموظف برفض المكالمة حالياً</span>`;
                
                setTimeout(function() {
                    if(outModal) outModal.style.cssText = 'display:none !important;';
                    endCall();
                }, 3000);
            } else if(d.status === 'ended') {
                if (typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
                if(outText) outText.innerText = "❌ تم إنهاء المكالمة.";
                setTimeout(function() {
                    if(outModal) outModal.style.cssText = 'display:none !important;';
                    endCall();
                }, 1200);
            }
        });
        
        if(!isGroup && typeof tgSendPushToUser === 'function') {
            tgSendPushToUser(targetEmpId, "📞 مكالمة واردة", `مكالمة واردة من ${meetingData.createdByName}. اضغط للرد أو الرفض`, 'livemeeting', {
                meetingId: _currentMeetingId,
                roomName: roomName,
                topic: topic,
                isCall: true
            });
        } else if(isGroup) {
            if(window.TG_USER && (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin')) {
                if(typeof tgBroadcastPush === 'function') {
                    tgBroadcastPush('🎥 اجتماع مباشر', `يوجد اجتماع جماعي الآن: ${topic}. يرجى الانضمام.`, 'livemeeting', '', {
                        meetingId: _currentMeetingId,
                        roomName: roomName,
                        topic: topic,
                        isCall: true
                    });
                }
            }
        }
        
    } catch(e) {
        if (typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
        console.error("Error creating meeting:", e);
        alert("حدث خطأ أثناء محاولة بدء الاجتماع. يرجى المحاولة مرة أخرى.");
    }
};

window.startJitsiMeeting = function(roomName, subject, isCreator) {
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    var wrapper = adminContainer || empContainer;
    
    var adminInner = document.getElementById('jitsiAdminInner');
    var empInner = document.getElementById('jitsiEmpInner');
    var inner = adminInner || empInner;
    
    var headerAdmin = document.getElementById('callStatusHeaderAdmin');
    var headerEmp = document.getElementById('callStatusHeaderEmp');
    var header = headerAdmin || headerEmp;
    if(header) header.innerHTML = `📞 مكالمة نشطة: ${subject || 'اجتماع مباشر'}`;
    
    _currentRoomUrl = `https://meet.ffmuc.net/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;
    
    var openBtnAdmin = document.getElementById('openJitsiDirectBtnAdmin');
    var openBtnEmp = document.getElementById('openJitsiDirectBtnEmp');
    if(openBtnAdmin) openBtnAdmin.href = _currentRoomUrl;
    if(openBtnEmp) openBtnEmp.href = _currentRoomUrl;
    
    if(wrapper) {
        wrapper.setAttribute('style', 'display:block !important; background:var(--bg2); border:2px solid var(--ok); border-radius:16px; padding:20px; text-align:center; margin-top:15px; margin-bottom:25px; box-shadow:0 8px 25px rgba(16,185,129,0.15);');
    }

    if(inner) {
        inner.style.display = 'block';
        inner.innerHTML = `
            <div style="background:#0f172a; border:2px solid #10b981; border-radius:18px; padding:35px 20px; text-align:center; box-shadow:0 10px 30px rgba(16,185,129,0.2); margin-top:15px;">
                <div style="font-size:55px; margin-bottom:12px;">🟢🎥</div>
                <h3 style="color:#ffffff; font-size:22px; font-weight:900; margin-bottom:8px;">غرفة الاجتماع المباشرة نشطة الآن</h3>
                <p style="color:#94a3b8; font-size:14px; max-width:550px; margin:0 auto 22px; font-weight:600;">تم تجهيز الشاشة الصوتية والمرئية بدون أي قيود زمنية. انقر على الزر بالأسفل للدخول المباشر.</p>
                <a href="${_currentRoomUrl}" target="_blank" style="background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; padding:15px 38px; border-radius:50px; font-size:17px; font-weight:900; text-decoration:none; display:inline-flex; align-items:center; gap:10px; box-shadow:0 8px 25px rgba(16,185,129,0.4);">
                    🚀 دخول شاشة الاجتماع الصوتية والمرئية الآن
                </a>
            </div>
        `;
        setTimeout(function() {
            inner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
    }
    
    try {
        _jitsiWindowRef = window.open(_currentRoomUrl, '_blank');
        if(_jitsiWindowRef) _jitsiWindowRef.focus();
    } catch(e) {}
};

window.joinCall = async function(meetingId, roomName, topic, isCreator) {
    _currentMeetingId = meetingId;
    
    if(!isCreator && window.db) {
        db.collection('meetings').doc(meetingId).update({
            status: 'active'
        }).catch(function(e){console.error(e)});
    }
    
    if(window._callStatusUnsubscribe) { window._callStatusUnsubscribe(); }
    window._callStatusUnsubscribe = db.collection('meetings').doc(meetingId).onSnapshot(function(doc) {
        if(!doc.exists) return;
        var d = doc.data();
        if(d.status === 'ended') {
            endCall();
        } else if(d.status === 'rejected') {
            endCall();
        }
    });
    
    startJitsiMeeting(roomName, topic, isCreator);
};

window.endCall = async function() {
    if(typeof closeLiveCallOverlay === 'function') closeLiveCallOverlay();
    if(typeof stopOutgoingRinging === 'function') stopOutgoingRinging();
    if(typeof stopMeetingRinging === 'function') stopMeetingRinging();

    var outModal = document.getElementById('outgoingMeetingModal');
    var incModal = document.getElementById('incomingMeetingModal');
    if(outModal) outModal.style.cssText = 'display:none !important;';
    if(incModal) incModal.style.cssText = 'display:none !important;';

    // 1. Instantly hide UI cards synchronously (0 delay, 100% guarantee)
    var adminContainer = document.getElementById('jitsiAdminContainer');
    var empContainer = document.getElementById('jitsiEmpContainer');
    if(adminContainer) {
        adminContainer.style.cssText = 'display:none !important;';
    }
    if(empContainer) {
        empContainer.style.cssText = 'display:none !important;';
    }
    
    var innerAdmin = document.getElementById('jitsiAdminInner');
    var innerEmp = document.getElementById('jitsiEmpInner');
    if(innerAdmin) { innerAdmin.innerHTML = ''; innerAdmin.style.display = 'none'; }
    if(innerEmp) { innerEmp.innerHTML = ''; innerEmp.style.display = 'none'; }
    
    // 2. Close window if open
    if(_jitsiWindowRef && !_jitsiWindowRef.closed) {
        try { _jitsiWindowRef.close(); } catch(e){}
        _jitsiWindowRef = null;
    }
    
    // 3. Unsubscribe listener
    if(window._callStatusUnsubscribe) {
        window._callStatusUnsubscribe();
        window._callStatusUnsubscribe = null;
    }
    
    // 4. Update Firestore status
    var meetingIdToEnd = _currentMeetingId;
    _currentMeetingId = null;
    
    if(meetingIdToEnd && window.db) {
        try {
            await db.collection('meetings').doc(meetingIdToEnd).update({
                status: 'ended',
                endedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch(e) {
            console.error("Error updating meeting status:", e);
        }
    }
};

window.endCallDirectly = async function(meetingId) {
    if(confirm("هل أنت متأكد من إنهاء وإغلاق هذه المكالمة؟")) {
        try {
            await db.collection('meetings').doc(meetingId).update({
                status: 'ended',
                endedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            if(_currentMeetingId === meetingId) {
                endCall();
            }
        } catch(e) {
            console.error("Error ending meeting:", e);
        }
    }
};

var _meetingListenerInit = false;
window.initMeetingsListener = function() {
    if(_meetingListenerInit) return;
    if(!window.db) {
        setTimeout(window.initMeetingsListener, 250);
        return;
    }
    _meetingListenerInit = true;
    
    db.collection('meetings').where('status', 'in', ['calling', 'active']).onSnapshot(function(snap) {
        var adminList = document.getElementById('activeMeetingsListAdmin');
        var empList = document.getElementById('activeMeetingsListEmp');
        var listContainer = adminList || empList;
        
        var currentUser = (window.firebase && firebase.auth && firebase.auth().currentUser) ? firebase.auth().currentUser : null;
        var myUid = (currentUser && currentUser.uid) ? currentUser.uid : ((window.TG_USER && TG_USER.uid) ? TG_USER.uid : '');
        
        // Reset active call users set
        window._activeCallUsers.clear();
        
        var hasActive = false;
        var html = '';
        
        // Handle removed/ended meetings from docChanges immediately for receiver!
        snap.docChanges().forEach(function(change) {
            if (change.type === 'removed') {
                var docId = change.doc.id;
                if (window._incomingCallData && window._incomingCallData.meetingId === docId) {
                    var inModal = document.getElementById('incomingMeetingModal');
                    if(inModal) inModal.style.cssText = 'display:none !important;';
                    if(typeof stopMeetingRinging === 'function') stopMeetingRinging();
                    window._incomingCallData = null;
                }
            }
        });
        
        snap.forEach(function(doc) {
            var data = doc.data();
            var createdAt = data.createdAt ? data.createdAt.toDate() : null;
            
            // Check if meeting ended or was rejected: Close ringing modals immediately!
            if (data.status === 'ended' || data.status === 'rejected') {
                var inModal = document.getElementById('incomingMeetingModal');
                if(inModal) inModal.style.cssText = 'display:none !important;';
                var outModal = document.getElementById('outgoingMeetingModal');
                if(outModal) outModal.style.cssText = 'display:none !important;';
                if(typeof stopMeetingRinging === 'function') stopMeetingRinging();
                window._incomingCallData = null;
                return;
            }
            
            // Reset declined flag for newly arriving calls
            if(data.status === 'calling' && window._lastRungCallId !== doc.id) {
window._declinedMeeting = false;
                window._lastRungCallId = doc.id;
            }
            
            // 45-second Call Timeout (No Answer)
            if (data.status === 'calling' && createdAt && (Date.now() - createdAt.getTime() > 45000)) {
                db.collection('meetings').doc(doc.id).update({ status: 'ended', endedReason: 'no_answer' }).catch(function(){});
                
                // If current user was target or caller, close ringing modal
                if (myUid && (data.targetUid === myUid || data.createdBy === myUid) && typeof stopMeetingRinging === 'function') {
                    var modal = document.getElementById('incomingMeetingModal');
                    if(modal) modal.style.display = 'none';
                    stopMeetingRinging();
                }
                return;
            }
            
            // Ignore meetings older than 5 minutes
            if(createdAt && (Date.now() - createdAt.getTime() > 300000)) {
                return;
            }
            
            // Track active participants for real-time status badges in employee list
            if (data.createdBy) window._activeCallUsers.add(data.createdBy);
            if (data.targetUid) window._activeCallUsers.add(data.targetUid);
            if (Array.isArray(data.participantUids)) {
                data.participantUids.forEach(pUid => window._activeCallUsers.add(pUid));
            }
            
            // Hide from list if this is the CURRENT call user is already inside locally
            if (_currentMeetingId === doc.id) {
                return;
            }
            
            hasActive = true; // Mark that an active call exists in the company
            
            var isCreator = myUid ? (data.createdBy === myUid) : false;
            
            // Robust multi-layered target check for 1-on-1 calls
            var isTarget = false;
            if (myUid && data.targetUid && data.targetUid === myUid) {
                isTarget = true;
            }
            if (!isTarget && window.TG_USER) {
                if (data.targetUid === TG_USER.uid || data.targetUid === TG_USER.id) isTarget = true;
                if (data.targetName && (data.targetName === TG_USER.name || data.targetName === TG_USER.displayName)) isTarget = true;
            }
            if (!isTarget && currentUser && currentUser.email && data.targetName) {
                var emailPrefix = currentUser.email.split('@')[0].toLowerCase();
                if (emailPrefix.length > 2 && data.targetName.toLowerCase().indexOf(emailPrefix) > -1) isTarget = true;
            }
            
            // Group call invitation check
            var isInvitedInGroup = false;
            if (data.isGroup) {
                if (data.isTargetedGroup && Array.isArray(data.participantUids)) {
                    data.participantUids.forEach(function(pUid) {
                        if (myUid && pUid === myUid) isInvitedInGroup = true;
                        if (window.TG_USER && (pUid === TG_USER.uid || pUid === TG_USER.id)) isInvitedInGroup = true;
                    });
                } else if (!data.isTargetedGroup) {
                    // General company meeting: all employees are invited
                    isInvitedInGroup = true;
                }
            }
            
            var isGroup = data.isGroup && !data.isTargetedGroup;
            var isAdmin = (window.TG_USER && (TG_USER.role === 'admin' || TG_USER.role === 'tech_admin'));
            var isParticipant = isCreator || isTarget || isGroup || isInvitedInGroup || isAdmin;
            
            var title = data.isGroup ? `اجتماع جماعي: ${data.topic || 'بدون عنوان'}` : `مكالمة فردية: ${data.topic || 'بدون عنوان'}`;
            var subtitle = data.isGroup ? `بواسطة: ${data.createdByName}` : `مكالمة بين: ${data.createdByName} و ${data.targetName || 'موظف'}`;
            var statusText = (data.status === 'calling') ? '📞 مكالمة واردة الآن (جاري الرنين 🔔)...' : '🟢 مباشر الآن';
            
            var endBtn = '';
            if(isCreator || isAdmin) {
                endBtn = `<button type="button" class="bt" onclick="endCallDirectly('${doc.id}')" style="background:var(--no) !important; color:#fff !important; font-size:13px; margin-right:5px; border:none; padding:6px 14px; border-radius:8px; cursor:pointer;"><i class="fa fa-stop"></i> إنهاء</button>`;
            }
            
            var actionBtns = '';
            var isIncomingForMe = (isTarget || isInvitedInGroup) && !isCreator && (data.status === 'calling');
            
            if (isIncomingForMe) {
                // Incoming call for this employee: Show big ACCEPT and DECLINE buttons right inside the Meeting Room!
                actionBtns = `
                    <button type="button" class="bt" onclick="window._incomingCallData={meetingId:'${doc.id}',roomName:'${data.roomName}',topic:'${(data.topic||'').replace(/'/g, "\\'")}'}; if(typeof acceptMeetingCall==='function') acceptMeetingCall();" style="background:linear-gradient(135deg, #10b981, #059669) !important; color:#fff !important; font-size:14px; font-weight:bold; border:none; padding:8px 20px; border-radius:30px; cursor:pointer; box-shadow:0 4px 15px rgba(16,185,129,0.4); display:flex; align-items:center; gap:8px;">
                        <span style="font-size:16px;">📞</span> قبول المكالمة
                    </button>
                    <button type="button" class="bt" onclick="window._incomingCallData={meetingId:'${doc.id}'}; if(typeof declineMeetingCall==='function') declineMeetingCall();" style="background:linear-gradient(135deg, #ef4444, #dc2626) !important; color:#fff !important; font-size:14px; font-weight:bold; border:none; padding:8px 20px; border-radius:30px; cursor:pointer; box-shadow:0 4px 15px rgba(239,68,68,0.4); display:flex; align-items:center; gap:8px;">
                        <span style="font-size:16px;">❌</span> رفض
                    </button>
                `;
            } else if (isParticipant) {
                actionBtns = `<button type="button" class="bt" onclick="joinCall('${doc.id}', '${data.roomName}', '${(data.topic || '').replace(/'/g, "\\'")}', ${isCreator})" style="background:var(--ok) !important; color:#fff !important; font-size:13px; border:none; padding:7px 16px; border-radius:8px; cursor:pointer;"><i class="fa fa-sign-in"></i> انضمام للمكالمة</button>`;
            } else {
                actionBtns = `<span style="background:rgba(156,163,175,0.15); color:var(--tx2); font-size:12px; padding:6px 14px; border-radius:8px; font-weight:bold;"><i class="fa fa-lock"></i> مكالمة ثنائية خاصة</span>`;
            }
            
            var cardBorder = isIncomingForMe ? '2px solid #10b981' : (isParticipant ? '1px solid var(--ok)' : '1px solid var(--bd)');
            var cardBg = isIncomingForMe ? 'rgba(16,185,129,0.08)' : 'var(--bg2)';
            
            html += `<div style="background:${cardBg}; border:${cardBorder}; padding:16px; border-radius:12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; border-left: 5px solid ${isParticipant ? '#10b981' : 'var(--tx2)'}; box-shadow:${isIncomingForMe ? '0 8px 25px rgba(16,185,129,0.2)' : 'none'};">
                <div>
                    <div style="font-weight:bold; color:var(--tx); font-size:15px;"><span style="color:${isIncomingForMe ? '#10b981' : (isParticipant ? 'var(--ok)' : 'var(--tx2)')}; font-size:11px; margin-left:6px; font-weight:900;">${statusText}</span> ${title}</div>
                    <div style="font-size:13px; color:var(--tx2); margin-top:4px;">${subtitle}</div>
                </div>
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    ${actionBtns}
                    ${endBtn}
                </div>
            </div>`;
            
            // Ringing logic: ring globally if target OR invited in group call, not creator, status is calling!
            var isDeclined = window._declinedMeetingsSet && window._declinedMeetingsSet.has(doc.id);
            var shouldRing = (isTarget || isInvitedInGroup) && !isCreator && (data.status === 'calling') && !isDeclined;
            if(shouldRing && !window._declinedMeeting) {
                 var modal = document.getElementById('incomingMeetingModal');
                 if(modal) {
                     modal.style.cssText = 'display:flex !important; position:fixed; top:0; left:0; right:0; bottom:0; background:radial-gradient(circle at center, rgba(16,185,129,0.2) 0%, rgba(15,23,42,0.98) 100%); z-index:9999999; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(16px); font-family:inherit;';
                 }
                 if(typeof playMeetingRinging === 'function') {
                     playMeetingRinging(data.createdByName, doc.id, data.roomName, data.topic);
                 }
            }
        });
        
        if (listContainer) {
            if(!hasActive) {
                listContainer.innerHTML = '<div style="color:var(--tx2); padding:10px; background:var(--bg2); border-radius:8px; text-align:center; font-size:13px;">لا توجد اجتماعات أو مكالمات نشطة حالياً في الشركة.</div>';
            } else {
                listContainer.innerHTML = html;
            }
        }
        
        // Re-render user status badges in real-time based on the updated window._activeCallUsers
        if (typeof window.renderUsersList === 'function' && window._lastUsersSnap) {
            window.renderUsersList(window._lastUsersSnap);
        }
    });
};




// ─── Fully Customized Monthly Reports & Plans (MR & MP) Engine ─────────────

// Helper state for active dynamic sections in Modal
window._mrActiveSections = [];
window._mpActiveItems = [];

// ─── CUSTOMIZED MONTHLY REPORT (MR) MODAL & LOGIC ────────────────────────────

window.tgOpenNewMonthlyReportModal = function() {
    window._mrEditingReportId = null;
    var now = new Date();
    var currentMonthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var u = window.TG_USER || {};
    var myRole = u.jobTitle || u.role || 'عضو في الفريق';

    var html = `
        <div id="mrModalOverlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.85); z-index:999999; display:flex; align-items:center; justify-content:center; padding:15px; backdrop-filter:blur(10px);">
            <div style="background:#1e293b; border:1.5px solid #334155; width:100%; max-width:820px; max-height:92vh; overflow-y:auto; border-radius:24px; padding:25px; box-shadow:0 25px 60px rgba(0,0,0,0.7); color:#ffffff; font-family:inherit;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1.5px solid #334155; padding-bottom:14px;">
                    <div>
                        <h3 style="margin:0; font-size:20px; font-weight:900; color:#34d399; display:flex; align-items:center; gap:8px;">📄 تقديم تقرير شهري مخصص (Customized MR)</h3>
                        <p style="margin:4px 0 0; font-size:12px; color:#94a3b8; font-weight:600;">قم بتحديد وتخصيص البنود والمؤشرات الخاصة بتخصصك وعملك خلال الشهر.</p>
                    </div>
                    <button type="button" onclick="document.getElementById('mrModalOverlay').remove()" style="background:#334155; border:none; color:#f8fafc; font-size:16px; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:900;">✕</button>
                </div>

                <form onsubmit="tgSubmitMonthlyReport(event)">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:18px;">
                        <div>
                            <label style="font-size:13px; font-weight:800; color:#93c5fd; display:block; margin-bottom:6px;">حدد الشهر والسنة *</label>
                            <input type="month" id="mrFormMonth" value="${currentMonthStr}" required style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-weight:700; outline:none;">
                        </div>
                        <div>
                            <label style="font-size:13px; font-weight:800; color:#93c5fd; display:block; margin-bottom:6px;">القسم / التخصص / المسمى الوظيفي *</label>
                            <input type="text" id="mrFormDept" value="${myRole}" required style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-weight:700; outline:none;">
                        </div>
                    </div>

                    

                    <!-- Dynamic Custom Sections Container -->
                    <div id="mrCustomSectionsContainer" style="display:flex; flex-direction:column; gap:16px; margin-bottom:20px;"></div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; background:#0f172a; padding:12px 16px; border-radius:14px; border:1px solid #334155;">
                        <button type="button" onclick="tgAddMRCustomSection('تصنيف مخصص جديد')" style="background:#334155; color:#34d399; border:1.5px dashed #34d399; padding:9px 18px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            ➕ إضافة موضوع جديد
                        </button>
                        <span style="font-size:12px; color:#94a3b8; font-weight:600;">💡 اضغط لإضافة حقول وبنود مخصصة دون حد</span>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:12px;">
                        <button type="button" onclick="document.getElementById('mrModalOverlay').remove()" style="background:#334155; color:#cbd5e1; border:1px solid #475569; padding:11px 24px; border-radius:10px; font-weight:800; cursor:pointer;">إلغاء</button>
                        <button type="submit" style="background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; border:none; padding:11px 28px; border-radius:10px; font-weight:900; cursor:pointer; box-shadow:0 4px 15px rgba(16,185,129,0.4);">إرسال التقرير المخصص للإدارة</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    window._mrActiveSections = [
        { title: '', items: [{ text: '', metric: '' }] }
    ];
    tgRenderMRSectionsInModal();
};

window.tgApplyMRTemplate = function(type) {
    window._mrActiveSections = [
        { title: '', items: [{ text: '', metric: '' }] }
    ];
    tgRenderMRSectionsInModal();
};

window.tgRenderMRSectionsInModal = function() {
    var container = document.getElementById('mrCustomSectionsContainer');
    if (!container) return;

    var html = '';
    window._mrActiveSections.forEach(function(sec, sIdx) {
        var topicNum = sIdx + 1;
        html += `
            <div class="mr-section-card" style="background:#0f172a; border:1.5px solid #334155; border-radius:16px; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:10px; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:8px; flex:1;">
                        <span style="background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.3); padding:4px 12px; border-radius:20px; font-weight:900; font-size:13px; white-space:nowrap;">
                            📌 الموضوع ${topicNum}:
                        </span>
                        <input type="text" value="${sec.title || ''}" onchange="window._mrActiveSections[${sIdx}].title = this.value" placeholder="أدخل عنوان الموضوع..." style="font-size:15px; font-weight:900; color:#34d399; background:transparent; border:none; border-bottom:1.5px dashed #34d399; width:100%; padding:4px 0; outline:none;">
                    </div>
                    ${window._mrActiveSections.length > 1 ? `
                        <button type="button" onclick="tgRemoveMRSection(${sIdx})" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#ef4444; border-radius:8px; padding:4px 10px; font-size:12px; font-weight:800; cursor:pointer;">🗑 حذف الموضوع</button>
                    ` : ''}
                </div>

                <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
                    ${(sec.items || []).map(function(item, iIdx) {
                        return `
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span style="color:#10b981; font-weight:900;">•</span>
                                <input type="text" value="${item.text || ''}" onchange="window._mrActiveSections[${sIdx}].items[${iIdx}].text = this.value" placeholder="اكتب النقطة / بند الإنجاز هنا..." required style="flex:2; padding:10px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#ffffff; font-size:13px; font-weight:600; outline:none;">
                                <input type="text" value="${item.metric || ''}" onchange="window._mrActiveSections[${sIdx}].items[${iIdx}].metric = this.value" placeholder="النتيجة/القيمة (اختياري)..." style="width:140px; padding:10px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#34d399; font-size:13px; font-weight:700; outline:none;">
                                ${(sec.items && sec.items.length > 1) ? `
                                    <button type="button" onclick="tgRemoveMRItem(${sIdx}, ${iIdx})" style="background:none; border:none; color:#ef4444; font-size:16px; cursor:pointer; font-weight:bold;">✕</button>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                <button type="button" onclick="tgAddMRItemToSection(${sIdx})" style="background:#1e293b; color:#34d399; border:1px solid #10b981; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
                    ➕ إضافة نقطة بهذا الموضوع
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
};

window.tgAddMRCustomSection = function(defaultTitle) {
    window._mrActiveSections.push({
        title: defaultTitle || 'قسم مخصص جديد',
        items: [{ text: '', metric: '' }]
    });
    tgRenderMRSectionsInModal();
};

window.tgRemoveMRSection = function(sIdx) {
    window._mrActiveSections.splice(sIdx, 1);
    tgRenderMRSectionsInModal();
};

window.tgAddMRItemToSection = function(sIdx) {
    if (window._mrActiveSections[sIdx]) {
        window._mrActiveSections[sIdx].items.push({ text: '', metric: '' });
        tgRenderMRSectionsInModal();
    }
};

window.tgRemoveMRItem = function(sIdx, iIdx) {
    if (window._mrActiveSections[sIdx] && window._mrActiveSections[sIdx].items) {
        window._mrActiveSections[sIdx].items.splice(iIdx, 1);
        tgRenderMRSectionsInModal();
    }
};


window.tgOpenEditMonthlyReportModal = function(reportId) {
    if (!reportId) return;

    var openModalWithData = function(r) {
        window._mrEditingReportId = reportId;
        var u = window.TG_USER || {};
        var myRole = r.userRole || r.department || u.jobTitle || u.role || 'عضو في الفريق';

        var html = `
            <div id="mrModalOverlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.85); z-index:999999; display:flex; align-items:center; justify-content:center; padding:15px; backdrop-filter:blur(10px);">
                <div style="background:#1e293b; border:1.5px solid #334155; width:100%; max-width:820px; max-height:92vh; overflow-y:auto; border-radius:24px; padding:25px; box-shadow:0 25px 60px rgba(0,0,0,0.7); color:#ffffff; font-family:inherit;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1.5px solid #334155; padding-bottom:14px;">
                        <div>
                            <h3 style="margin:0; font-size:20px; font-weight:900; color:#3b82f6; display:flex; align-items:center; gap:8px;">✏️ تعديل وتحديث التقرير الشهري المخصص (MR)</h3>
                            <p style="margin:4px 0 0; font-size:12px; color:#94a3b8; font-weight:600;">قم بتعديل وتحديث البنود والتصنيفات المطلوبة ثم اضغط على حفظ وإعادة الإرسال للإدارة.</p>
                        </div>
                        <button type="button" onclick="document.getElementById('mrModalOverlay').remove()" style="background:#334155; border:none; color:#f8fafc; font-size:16px; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:900;">✕</button>
                    </div>

                    ${r.adminNotes ? `
                        <div style="background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; padding:12px 16px; border-radius:12px; font-size:13px; color:#fca5a5; margin-bottom:20px; font-weight:bold;">
                            ⚠️ توجيه الإدارة للتعديل: ${r.adminNotes}
                        </div>
                    ` : ''}

                    <form onsubmit="tgSubmitMonthlyReport(event)">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:18px;">
                            <div>
                                <label style="font-size:13px; font-weight:800; color:#93c5fd; display:block; margin-bottom:6px;">الشهر والسنة *</label>
                                <input type="month" id="mrFormMonth" value="${r.monthYear || ''}" required style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-weight:700; outline:none;">
                            </div>
                            <div>
                                <label style="font-size:13px; font-weight:800; color:#93c5fd; display:block; margin-bottom:6px;">القسم / التخصص / المسمى الوظيفي *</label>
                                <input type="text" id="mrFormDept" value="${myRole}" required style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-weight:700; outline:none;">
                            </div>
                        </div>

                        <!-- Dynamic Custom Sections Container -->
                        <div id="mrCustomSectionsContainer" style="display:flex; flex-direction:column; gap:16px; margin-bottom:20px;"></div>

                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; background:#0f172a; padding:12px 16px; border-radius:14px; border:1px solid #334155;">
                            <button type="button" onclick="tgAddMRCustomSection('تصنيف مخصص جديد')" style="background:#334155; color:#34d399; border:1.5px dashed #34d399; padding:9px 18px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                ➕ إضافة موضوع جديد
                            </button>
                            <span style="font-size:12px; color:#94a3b8; font-weight:600;">💡 أضف أو غيّر بنود التقرير حسب التوجيه</span>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:12px;">
                            <button type="button" onclick="document.getElementById('mrModalOverlay').remove()" style="background:#334155; color:#cbd5e1; border:1px solid #475569; padding:11px 24px; border-radius:10px; font-weight:800; cursor:pointer;">إلغاء</button>
                            <button type="submit" style="background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#ffffff; border:none; padding:11px 28px; border-radius:10px; font-weight:900; cursor:pointer; box-shadow:0 4px 15px rgba(59,130,246,0.4);">💾 حفظ التعديلات وإعادة إرسال التقرير للإدارة</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);

        var sections = r.customSections || [];
        if (sections.length === 0) {
            sections = [
                { title: '🎯 الإنجازات والأهداف المحققة', items: [{ text: r.achievements || '', metric: '' }] },
                { title: '⚠️ التحديات والمقترحات', items: [{ text: r.challenges || '', metric: '' }] },
                { title: '🚀 أهداف وتطلعات الشهر القادم', items: [{ text: r.nextMonthGoals || '', metric: '' }] }
            ];
        }
        window._mrActiveSections = JSON.parse(JSON.stringify(sections));
        tgRenderMRSectionsInModal();
    };

    var foundInMem = (window._allMonthlyReports || []).find(function(item){ return item.id === reportId; });
    if (foundInMem) {
        openModalWithData(foundInMem);
    } else if (window.db) {
        db.collection('monthly_reports').doc(reportId).get().then(function(doc) {
            if (doc.exists) openModalWithData(doc.data());
            else alert("التقرير غير موجود!");
        });
    }
};


window.tgSubmitMonthlyReport = function(e) {
    e.preventDefault();
    if (!window.db) return;

    var u = window.TG_USER || {};
    var myUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : '');
    var myName = u.name || u.displayName || 'موظف';

    var monthYear = document.getElementById('mrFormMonth').value;
    var department = document.getElementById('mrFormDept').value;

    var customSections = [];
    window._mrActiveSections.forEach(function(sec) {
        var cleanItems = (sec.items || []).filter(function(it) { return it.text && it.text.trim().length > 0; });
        if (cleanItems.length > 0) {
            customSections.push({
                title: sec.title || 'تصنيف مخصص',
                items: cleanItems
            });
        }
    });

    if (customSections.length === 0) {
        alert("يرجى إدخال بند واحد على الأقل في التقرير الشهري!");
        return;
    }

    var achievementsText = '';
    var challengesText = '';
    var nextGoalsText = '';

    customSections.forEach(function(sec) {
        var text = sec.title + ':\n' + sec.items.map(function(it){ return '• ' + it.text + (it.metric ? ' ['+it.metric+']' : ''); }).join('\n') + '\n\n';
        if (sec.title.indexOf('تحديات') !== -1 || sec.title.indexOf('معوقات') !== -1) {
            challengesText += text;
        } else if (sec.title.indexOf('قادم') !== -1 || sec.title.indexOf('تطلعات') !== -1) {
            nextGoalsText += text;
        } else {
            achievementsText += text;
        }
    });

    var reportData = {
        uid: myUid,
        userName: myName,
        userRole: department,
        department: department,
        monthYear: monthYear,
        customSections: customSections,
        achievements: achievementsText.trim(),
        challenges: challengesText.trim() || 'لا يوجد',
        nextMonthGoals: nextGoalsText.trim() || 'لا يوجد',
        status: 'pending',
        adminNotes: ''
    };

    var promise;
    if (window._mrEditingReportId) {
        promise = db.collection('monthly_reports').doc(window._mrEditingReportId).update(reportData);
    } else {
        reportData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        promise = db.collection('monthly_reports').add(reportData);
    }

    promise.then(function() {
        if (document.getElementById('mrModalOverlay')) document.getElementById('mrModalOverlay').remove();
        if (typeof tgShowToast === 'function') {
            tgShowToast('✅ تم رفع التقرير الشهري المخصص بنجاح!');
        } else {
            alert('✅ تم رفع التقرير الشهري المخصص بنجاح!');
        }
        var _u = window.TG_USER || {};
        if (typeof tgNotifyAdminsReportSubmitted === 'function') {
            tgNotifyAdminsReportSubmitted('📄 تقرير شهري جديد (MR)', _u.name || _u.displayName || 'موظف', 'تقريره الشهري لشهر ' + (monthYear || ''), 'monthly-report-new');
        }

        if (typeof loadMonthlyReportsEmp === 'function') loadMonthlyReportsEmp();
        if (typeof tgRenderMonthlyReportsAdmin === 'function') tgRenderMonthlyReportsAdmin();
    }).catch(function(err) {
        alert("حدث خطأ أثناء حفظ التقرير: " + err.message);
    });
};

// Helper function to aggregate and group employee plans by normalized department names
window.tgGetAggregatedDeptBreakdown = async function(targetMonth) {
    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase && firebase.firestore ? firebase.firestore() : null));
    if (!targetDb) return {};
    try {
        var snap = await targetDb.collection('monthly_plans').get();
        var deptMap = {};
        snap.forEach(function(doc) {
            var p = doc.data();
            if (p.type === 'executive_master') return;
            if (targetMonth && p.monthYear && p.monthYear !== targetMonth) return;

            var rawDept = p.department || p.targetName || p.userRole || p.creatorName || 'المبيعات';
            var deptName = rawDept.trim();

            if (deptName.includes('مبيعات') || deptName.includes('سيلز') || deptName.toLowerCase().includes('sales')) {
                deptName = 'قطاع المبيعات واستقطاب العملاء';
            } else if (deptName.includes('برمج') || deptName.includes('تطوير') || deptName.toLowerCase().includes('dev') || deptName.toLowerCase().includes('tech')) {
                deptName = 'قطاع البرمجة وتكنولوجيا المعلومات';
            } else if (deptName.toLowerCase().includes('graphic') || deptName.includes('تصميم') || deptName.includes('ديزاين')) {
                deptName = 'قطاع الجرافيك والتصميم (Graphic Design)';
            } else if (deptName.includes('خدمة') || deptName.includes('دعم')) {
                deptName = 'قطاع خدمة العملاء والدعم الفني';
            }

            if (!deptMap[deptName]) deptMap[deptName] = [];

            var userName = p.creatorName || p.userName || p.targetName || 'موظف';
            var tasks = p.tasks || [];
            tasks.forEach(function(t) {
                deptMap[deptName].push({
                    userName: userName,
                    taskTitle: t.title || '',
                    week: t.week || 'أسبوع',
                    done: !!t.done,
                    kpi: t.kpi || ''
                });
            });
        });
        return deptMap;
    } catch (e) {
        console.error('Error aggregating department plans breakdown:', e);
        return {};
    }
};

window.tgRenderMonthlyPlansAdmin = async function(retryCount) {
    if (!retryCount) retryCount = 0;
    var listEl = document.getElementById('mpAdminList');
    if (!listEl) return;

    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase && firebase.firestore ? firebase.firestore() : null));

    if (!targetDb) {
        if (retryCount < 10) {
            setTimeout(function() { tgRenderMonthlyPlansAdmin(retryCount + 1); }, 300);
            return;
        }
        listEl.innerHTML = `
            <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:45px; text-align:center; border-radius:16px; color:var(--tx2); font-weight:bold; font-size:15px;">
                🎯 لا توجد خطط شهرية معرفة حالياً أو تعذر الاتصال بقاعدة البيانات. <button type="button" onclick="tgRenderMonthlyPlansAdmin()" class="bt bt-o" style="margin-right:10px;">إعادة المحاولة 🔄</button>
            </div>
        `;
        return;
    }

    if (window._mpAdminUnsub) {
        try { window._mpAdminUnsub(); } catch(e){}
    }

    window._mpAdminUnsub = targetDb.collection('monthly_plans').onSnapshot(async function(snap) {
        try {
            var plans = [];
        snap.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            plans.push(data);
        });

        plans.sort(function(a, b) {
            var tA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
            var tB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
            return tB - tA;
        });

        if (plans.length === 0) {
            listEl.innerHTML = `
                <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:45px; text-align:center; border-radius:16px; color:var(--tx2); font-weight:bold; font-size:15px;">
                    🎯 لا توجد خطط شهرية معرفة حالياً. اضغط على "إنشاء خطة شهرية" أو "تقديم خطة من بوابة الموظف" للبدء.
                </div>
            `;
            return;
        }

        var controlBarHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:18px; background:var(--bg2); padding:12px 18px; border-radius:14px; border:1.5px solid var(--bd); box-shadow:0 2px 10px rgba(0,0,0,0.04);">
                <span style="font-size:13.5px; font-weight:800; color:var(--tx2);">📋 عدد الخطط المتاحة: <b>${plans.length}</b></span>
                <div style="display:flex; gap:10px;">
                    <button type="button" onclick="tgExpandAllCards('mpAdminList')" class="bt bt-o" style="font-size:12.5px; padding:6px 14px; border-radius:20px; font-weight:800; cursor:pointer;">📂 فتح جميع الكروت</button>
                    <button type="button" onclick="tgCollapseAllCards('mpAdminList')" class="bt bt-o" style="font-size:12.5px; padding:6px 14px; border-radius:20px; font-weight:800; cursor:pointer;">📁 طي جميع الكروت</button>
                </div>
            </div>
        `;
        var html = controlBarHTML;
        for (var i = 0; i < plans.length; i++) {
            var p = plans[i];
            var isExecMaster = (p.type === 'executive_master');
            var cardStyle = isExecMaster 
                ? 'background:linear-gradient(180deg, rgba(245,158,11,0.08) 0%, var(--bg2) 100%); border:2px solid #f59e0b; border-radius:20px; box-shadow:0 10px 30px rgba(245,158,11,0.15); padding:22px; margin-bottom:20px;' 
                : 'background:var(--bg2); border:1.5px solid var(--bd); border-radius:18px; box-shadow:0 4px 20px rgba(0,0,0,0.06); padding:20px; margin-bottom:20px;';

            if (isExecMaster) {
                var deptBreakdownObj = p.deptBreakdown;
                if (!deptBreakdownObj || Object.keys(deptBreakdownObj).length === 0) {
                    deptBreakdownObj = await tgGetAggregatedDeptBreakdown(p.monthYear);
                }
                var deptKeys = (typeof deptBreakdownObj === 'object') ? Object.keys(deptBreakdownObj) : [];
                var deptCount = deptKeys.length;

                var deptGridHTML = '';
                if (deptCount > 0) {
                    deptGridHTML = `
                        <div style="margin-top:18px; border-top:1.5px dashed rgba(245,158,11,0.35); padding-top:18px;">
                            <strong style="color:#fbbf24; font-size:15px; font-weight:900; display:block; margin-bottom:14px;">
                                📊 تفكيك ومراجعة خطط الأقسام والموظفين (${deptCount} أقسام):
                            </strong>
                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:14px; align-items:start;">
                                ${deptKeys.map(function(deptName, deptIdx) {
                                    var items = deptBreakdownObj[deptName] || [];
                                    var initialItems = items.slice(0, 3);
                                    var remainingItems = items.slice(3);
                                    var hiddenElemId = 'plan-dept-more-' + p.id + '-' + deptIdx;

                                    function renderItem(it) {
                                        return `
                                            <div style="font-size:13px; background:var(--bg2); border:1px solid var(--bd); padding:10px 14px; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                                    <span style="color:#38bdf8; font-weight:900; font-size:12.5px;">👤 ${it.userName || 'موظف'}</span>
                                                    <span style="background:rgba(59,130,246,0.15); color:#60a5fa; padding:2px 8px; border-radius:6px; font-size:10.5px; font-weight:800;">${it.week || 'أسبوع'}</span>
                                                </div>
                                                <div style="color:var(--tx); font-weight:700; font-size:13px; line-height:1.6;">${it.done ? '✅ ' : '⚪ '}${it.taskTitle || ''}</div>
                                            </div>
                                        `;
                                    }

                                    return `
                                        <div style="background:var(--bg); border:1.5px solid var(--bd); border-radius:16px; padding:16px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
                                            <div style="background:linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05)); border:1px solid rgba(245,158,11,0.3); border-radius:12px; padding:10px 14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                                                <span style="color:#fbbf24; font-weight:900; font-size:13.5px;">🏛️ قسم / قطاع: ${deptName}</span>
                                                <span style="font-size:11px; background:rgba(245,158,11,0.25); color:#fbbf24; padding:3px 10px; border-radius:20px; font-weight:900;">${items.length} بند</span>
                                            </div>

                                            <div style="display:flex; flex-direction:column; gap:8px;">
                                                ${initialItems.map(renderItem).join('')}
                                            </div>

                                            ${remainingItems.length > 0 ? `
                                                <div id="${hiddenElemId}" style="display:none; flex-direction:column; gap:8px; margin-top:8px;">
                                                    ${remainingItems.map(renderItem).join('')}
                                                </div>
                                                <button type="button" onclick="tgToggleDeptItems('${hiddenElemId}', this, ${remainingItems.length})" style="width:100%; margin-top:10px; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#38bdf8; font-weight:900; font-size:12px; padding:9px; border-radius:10px; cursor:pointer; transition:all 0.2s; text-align:center;">
                                                    👇 قراءة المزيد (+${remainingItems.length} بند)
                                                </button>
                                            ` : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }

                var execBodyId = 'mp-body-' + p.id;

                html += `
                    <div class="card p-3 mb-3" style="${cardStyle}">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                            <div>
                                <h3 style="font-size:19px; font-weight:900; color:var(--tx); margin:0 0 4px;">✨ الخطة الشهرية التجميعية للإدارة العليا</h3>
                                <span style="color:var(--tx2); font-weight:700; font-size:13px;">الشهر المستهدف: ${p.monthYear || ''}</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span class="badge" style="background:rgba(245,158,11,0.25); color:#fbbf24; border:1.5px solid #f59e0b; font-weight:900; padding:6px 18px; border-radius:30px;">✨ خطة استراتيجية تجميعية</span>
                                <button type="button" onclick="tgToggleCardDetails('${execBodyId}', this)" class="tg-toggle-btn bt bt-o" style="font-size:12.5px; padding:6px 16px; border-radius:20px; font-weight:800; cursor:pointer;">
                                    🔻 عرض التفاصيل والبنود
                                </button>
                            </div>
                        </div>

                        <!-- Collapsible Body for Master Executive Plan -->
                        <div id="${execBodyId}" class="tg-card-body" style="display:none; margin-top:16px; border-top:1.5px dashed var(--bd); padding-top:16px;">
                            <div style="background:var(--bg); border:1.5px solid rgba(245,158,11,0.35); padding:18px; border-radius:16px; margin-bottom:16px;">
                                ${p.execSummary ? `
                                <div style="margin-bottom:14px; background:rgba(245,158,11,0.08); border:1.5px solid rgba(245,158,11,0.25); border-radius:14px; padding:14px;">
                                    <strong style="color:#fbbf24; font-size:14.5px; font-weight:900; display:block; margin-bottom:8px;">📝 الخلاصة والرؤية الاستراتيجية للشركة (Strategic Summary):</strong>
                                    <div style="color:var(--tx); font-size:14px; font-weight:700; white-space:pre-line; line-height:1.7; background:var(--bg2); padding:12px 16px; border-radius:10px; border:1px solid var(--bd);">${p.execSummary}</div>
                                </div>` : ''}

                                ${p.execDirectives ? `
                                <div style="margin-bottom:14px; background:rgba(16,185,129,0.08); border:1.5px solid rgba(16,185,129,0.25); border-radius:14px; padding:14px;">
                                    <strong style="color:#34d399; font-size:14.5px; font-weight:900; display:block; margin-bottom:8px;">🎯 الأهداف الاستراتيجية والتوجيهات التنفيذية (Directives):</strong>
                                    <div style="color:var(--tx); font-size:14px; font-weight:700; white-space:pre-line; line-height:1.7; background:var(--bg2); padding:12px 16px; border-radius:10px; border:1px solid var(--bd);">${p.execDirectives}</div>
                                </div>` : ''}

                                ${deptGridHTML}
                            </div>

                            <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; align-items:center; border-top:1px solid var(--bd); padding-top:14px; margin-top:10px;">
                                <button type="button" onclick="tgPrintMonthlyPlan('${p.id}')" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-size:13.5px; padding:10px 22px; font-weight:900; border:none; border-radius:50px; box-shadow:0 4px 14px rgba(16,185,129,0.35); cursor:pointer;">🖨 طباعة الخطة التجميعية MP</button>
                                <button type="button" onclick="tgDeleteMonthlyPlan('${p.id}')" class="bt bt-o" style="border-color:#ef4444; color:#ef4444; font-size:13.5px; padding:10px 18px; font-weight:800; border-radius:50px;">🗑 حذف الخطة</button>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                var tasks = p.tasks || [];
                var completedCount = tasks.filter(function(t){ return t.done; }).length;
                var progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : (p.progress || 0);



                html += `
                    <div class="card p-3 mb-3" style="${cardStyle}">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                            <div>
                                <h3 style="font-size:19px; font-weight:900; color:var(--tx); margin:0 0 6px;">📌 ${p.title || 'خطة شهرية'}</h3>
                                <div style="display:flex; gap:10px; flex-wrap:wrap; font-size:13px; font-weight:800; color:var(--tx2); margin-top:4px;">
                                    <span style="color:#0284c7; background:rgba(2,132,199,0.12); padding:4px 12px; border-radius:8px; border:1px solid rgba(2,132,199,0.25);">👤 الموظف (الراسل): <b>${p.creatorName || p.userName || 'غير محدد'}</b></span>
                                    <span style="color:#10b981; background:rgba(16,185,129,0.12); padding:4px 12px; border-radius:8px; border:1px solid rgba(16,185,129,0.25);">🏢 القسم: <b>${p.department || p.targetName || 'قسم عام'}</b></span>
                                    <span style="color:#f59e0b; background:rgba(245,158,11,0.12); padding:4px 12px; border-radius:8px; border:1px solid rgba(245,158,11,0.25);">📅 الشهر: <b>${p.monthYear || ''}</b></span>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span class="badge" style="background:#10b981; color:#fff; font-size:13px; font-weight:800; padding:6px 16px; border-radius:30px;">إنجاز ${progress}%</span>
                                <button type="button" onclick="tgToggleCardDetails('mp-body-${p.id}', this)" class="tg-toggle-btn bt bt-o" style="font-size:12.5px; padding:6px 16px; border-radius:20px; font-weight:800; cursor:pointer;">
                                    🔽 عرض التفاصيل والبنود
                                </button>
                            </div>
                        </div>

                        <!-- Collapsible Body -->
                        <div id="mp-body-${p.id}" class="tg-card-body" style="display:none; margin-top:16px; border-top:1.5px dashed var(--bd); padding-top:16px;">
                            <!-- Progress Bar -->
                            <div style="background:var(--bg); border:1.5px solid var(--bd); height:14px; border-radius:10px; overflow:hidden; margin-bottom:15px;">
                                <div style="background:linear-gradient(90deg, #10b981, #34d399); height:100%; width:${progress}%; transition:width 0.4s;"></div>
                            </div>

                            <div style="background:rgba(16,185,129,0.08); border:1.5px solid rgba(16,185,129,0.25); border-radius:14px; padding:14px; margin-bottom:15px;">
                                <strong style="color:#34d399; font-size:14.5px; font-weight:900; display:block; margin-bottom:8px;">📌 الملخص الاستراتيجي:</strong>
                                <div style="white-space:pre-line; line-height:1.7; color:var(--tx); font-weight:700; background:var(--bg2); padding:12px 16px; border-radius:10px; border:1px solid var(--bd);">${p.objectives || 'لم تذكر'}</div>
                            </div>

                            <!-- Tasks Checklist Preview -->
                            <div style="background:var(--bg); padding:16px; border-radius:14px; border:1.5px solid var(--bd); margin-bottom:15px;">
                                <strong style="color:var(--tx); font-size:14px; font-weight:900; display:block; margin-bottom:10px;">✅ بنود وقائمة تنفيذ الخطة (${completedCount} من ${tasks.length}):</strong>
                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                                    ${tasks.map(function(t) {
                                        return `
                                            <div style="font-size:13px; padding:10px 12px; background:var(--bg2); border:1.5px solid var(--bd); border-radius:10px; color:${t.done ? '#10b981' : 'var(--tx)'}; font-weight:${t.done ? '800' : '600'}; display:flex; justify-content:space-between; align-items:center;">
                                                <span>${t.done ? '✔' : '⚪'} ${t.title}</span>
                                                <span style="font-size:11px; background:rgba(59,130,246,0.15); color:#60a5fa; padding:2px 6px; border-radius:6px; font-weight:800;">${t.week || 'أسبوع'}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>

                            <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--bd); padding-top:14px;">
                                <button type="button" onclick="tgOpenEditMonthlyPlanModal('${p.id}')" class="bt" style="background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#fff; font-size:13.5px; padding:10px 22px; font-weight:900; border:none; border-radius:50px; box-shadow:0 4px 14px rgba(59,130,246,0.35); cursor:pointer;">✏️ تعديل الخطة</button>
                                <button type="button" onclick="tgPrintMonthlyPlan('${p.id}')" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-size:13.5px; padding:10px 22px; font-weight:900; border:none; border-radius:50px; box-shadow:0 4px 14px rgba(16,185,129,0.35); cursor:pointer;">🖨 طباعة الخطة MP</button>
                                <button type="button" onclick="tgDeleteMonthlyPlan('${p.id}')" class="bt bt-o" style="border-color:#ef4444; color:#ef4444; font-size:13.5px; padding:10px 18px; font-weight:800; border-radius:50px;">🗑 حذف الخطة</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        listEl.innerHTML = html;
        } catch(err) {
            console.error("Error processing monthly plans snapshot:", err);
            if (listEl) {
                listEl.innerHTML = `
                    <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:45px; text-align:center; border-radius:16px; color:var(--tx2); font-weight:bold; font-size:15px;">
                        🎯 لا توجد خطط شهرية معرفة حالياً. اضغط على "إنشاء خطة شهرية" أو "إنشاء الخطة التجميعية" أعلاه للبدء.
                    </div>
                `;
            }
        }
    }, function(err) {
        console.error("Error listening to monthly plans:", err);
        if (listEl) {
            listEl.innerHTML = `
                <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:45px; text-align:center; border-radius:16px; color:var(--tx2); font-weight:bold; font-size:15px;">
                    🎯 لا توجد خطط شهرية معرفة حالياً. اضغط على "إنشاء خطة شهرية" أو "إنشاء الخطة التجميعية" أعلاه للبدء.
                </div>
            `;
        }
    });
};

// ─── EMPLOYEE MONTHLY PLAN HANDLERS (MP) ─────────────────────────────────



window.loadMonthlyPlansAdmin = function(container) {
    if (!container) container = document.getElementById('pg-monthlyplans');
    if (!container) return;

    container.innerHTML = `
        <div class="set-sec">
            <!-- Centralized Reports Hub Switcher Bar -->
            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:22px; background:var(--bg2); padding:10px; border-radius:18px; border:1.5px solid var(--bd); box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                <button type="button" onclick="go('wkr')" class="bt" style="flex:1; min-width:200px; background:transparent; color:var(--tx); font-weight:800; font-size:14.5px; padding:12px; border-radius:12px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span>📊</span> التقارير الشاملة (أسبوعية وشهرية WR & MR)
                </button>
                <button type="button" onclick="go('monthlyplans')" class="bt" style="flex:1; min-width:200px; background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; font-weight:900; font-size:14.5px; padding:12px; border-radius:12px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span>🎯</span> الخطط الشهرية (Monthly Plans - MP)
                </button>
            </div>

            <!-- Page Title & Actions -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:22px; padding-bottom:16px; border-bottom:1.5px solid var(--bd);">
                <div>
                    <h2 style="font-size:24px; font-weight:900; color:var(--tx); margin:0 0 6px;">🎯 إدارة الخطط الشهرية المخصصة (Monthly Plans - MP)</h2>
                    <p style="color:var(--tx2); font-size:14px; margin:0; font-weight:600;">وضع الخطط الشهرية، المستهدفات الأسبوعية، ورصد الخطة التجميعية للإدارة العليا.</p>
                </div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <button type="button" onclick="tgGenerateMasterExecutivePlanModal()" class="bt" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; font-weight:900; font-size:14px; padding:12px 24px; border-radius:50px; box-shadow:0 6px 20px rgba(245,158,11,0.35); border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                        <span>✨</span> إنشاء الخطة الشهرية التجميعية للإدارة
                    </button>
                    <button type="button" onclick="tgOpenNewMonthlyPlanModal()" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-weight:900; font-size:14px; padding:12px 24px; border-radius:50px; box-shadow:0 6px 20px rgba(16,185,129,0.35); border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                        <span>➕</span> إنشاء خطة شهرية مخصصة
                    </button>
                </div>
            </div>

            <div id="mpAdminList">
                <div style="text-align:center; padding:35px; color:var(--tx2); font-weight:bold;">⏳ جاري تحميل الخطط الشهرية...</div>
            </div>
        </div>
    `;

    tgRenderMonthlyPlansAdmin();


window.tgRenderMonthlyPlansEmp = function() {
    var listEl = document.getElementById('mpEmpList');
    if (!listEl || !window.db) return;

    var u = window.TG_USER || {};
    var myUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : '');

    if (window._mpEmpUnsub) {
        try { window._mpEmpUnsub(); } catch(e){}
    }

    window._mpEmpUnsub = db.collection('monthly_plans').onSnapshot(function(snap) {
        var plans = [];
        snap.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            if (data.type === 'executive_master') return;
            if (data.uid === myUid || data.createdBy === myUid || (data.creatorName && data.creatorName === u.name)) {
                plans.push(data);
            }
        });

        plans.sort(function(a, b) {
            var tA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
            var tB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
            return tB - tA;
        });

        if (plans.length === 0) {
            listEl.innerHTML = `
                <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:40px; text-align:center; border-radius:16px; color:var(--tx2); font-weight:bold; font-size:14.5px;">
                    🎯 لا توجد خطط شهرية مُقدمة منك حالياً. اضغط على "تقديم خطة شهرية جديدة للإدارة" أعلاه لإرسال خطتك.
                </div>
            `;
            return;
        }

        var html = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px; background:var(--bg2); padding:12px 18px; border-radius:14px; border:1.5px solid var(--bd);">
                <span style="font-size:13.5px; font-weight:800; color:var(--tx2);">📋 عدد خططك المسجلة: <b>${plans.length}</b></span>
                <div style="display:flex; gap:10px;">
                    <button type="button" onclick="tgExpandAllCards('mpEmpList')" class="bt bt-o" style="font-size:12.5px; padding:6px 14px; border-radius:20px; font-weight:800; cursor:pointer;">📂 فتح جميع الكروت</button>
                    <button type="button" onclick="tgCollapseAllCards('mpEmpList')" class="bt bt-o" style="font-size:12.5px; padding:6px 14px; border-radius:20px; font-weight:800; cursor:pointer;">📁 طي جميع الكروت</button>
                </div>
            </div>
        `;
        plans.forEach(function(p, pIdx) {
            var tasks = p.tasks || [];
            var completedCount = tasks.filter(function(t){ return t.done; }).length;
            var progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : (p.progress || 0);

            html += `
                <div class="card p-3 mb-3" style="background:var(--bg2); border:1.5px solid var(--bd); border-radius:18px; box-shadow:0 4px 20px rgba(0,0,0,0.06); padding:20px; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div>
                            <h3 style="font-size:18.5px; font-weight:900; color:var(--tx); margin:0 0 6px;">📌 ${p.title || 'خطة شهرية'}</h3>
                            <div style="display:flex; gap:10px; flex-wrap:wrap; font-size:13px; font-weight:800; color:var(--tx2); margin-top:4px;">
                                <span style="color:#0284c7; background:rgba(2,132,199,0.12); padding:4px 12px; border-radius:8px; border:1px solid rgba(2,132,199,0.25);">👤 الموظف (الراسل): <b>${p.creatorName || u.name || 'موظف'}</b></span>
                                <span style="color:#10b981; background:rgba(16,185,129,0.12); padding:4px 12px; border-radius:8px; border:1px solid rgba(16,185,129,0.25);">🏢 القسم: <b>${p.department || u.role || 'قسم عام'}</b></span>
                                <span style="color:#f59e0b; background:rgba(245,158,11,0.12); padding:4px 12px; border-radius:8px; border:1px solid rgba(245,158,11,0.25);">📅 الشهر: <b>${p.monthYear || ''}</b></span>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span class="badge" style="background:#10b981; color:#fff; font-size:13px; font-weight:900; padding:6px 16px; border-radius:30px;">نسبة الإنجاز ${progress}%</span>
                            <button type="button" onclick="tgToggleCardDetails('mp-emp-body-${p.id}', this)" class="tg-toggle-btn bt bt-o" style="font-size:12.5px; padding:6px 16px; border-radius:20px; font-weight:800; cursor:pointer;">
                                ${pIdx === 0 ? '🔼 إخفاء التفاصيل' : '🔽 عرض التفاصيل والبنود'}
                            </button>
                        </div>
                    </div>

                    <!-- Collapsible Body -->
                    <div id="mp-emp-body-${p.id}" class="tg-card-body" style="display:${pIdx === 0 ? 'block' : 'none'}; margin-top:16px; border-top:1.5px dashed var(--bd); padding-top:16px;">
                        <!-- Progress Bar -->
                        <div style="background:var(--bg); border:1.5px solid var(--bd); height:12px; border-radius:10px; overflow:hidden; margin-bottom:14px;">
                            <div style="background:linear-gradient(90deg, #10b981, #34d399); height:100%; width:${progress}%; transition:width 0.4s;"></div>
                        </div>

                        <div style="background:rgba(16,185,129,0.08); border:1.5px solid rgba(16,185,129,0.25); border-radius:14px; padding:14px; margin-bottom:14px;">
                            <strong style="color:#34d399; font-size:14px; font-weight:900; display:block; margin-bottom:6px;">📌 الملخص والاستراتيجية:</strong>
                            <div style="white-space:pre-line; line-height:1.6; color:var(--tx); font-weight:700; font-size:13.5px;">${p.objectives || 'لا يوجد ملخص'}</div>
                        </div>

                        <!-- Tasks Checklist with interactive checkboxes -->
                        <div style="background:var(--bg); padding:16px; border-radius:14px; border:1.5px solid var(--bd); margin-bottom:14px;">
                            <strong style="color:var(--tx); font-size:14px; font-weight:900; display:block; margin-bottom:10px;">✅ بنود وقائمة تنفيذ الخطة (${completedCount} من ${tasks.length}):</strong>
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                ${tasks.map(function(t, tIdx) {
                                    return `
                                        <label style="font-size:13.5px; padding:10px 14px; background:var(--bg2); border:1.5px solid var(--bd); border-radius:10px; color:${t.done ? '#10b981' : 'var(--tx)'}; font-weight:${t.done ? '800' : '600'}; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                                            <div style="display:flex; align-items:center; gap:10px;">
                                                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="tgToggleEmpPlanTaskDone('${p.id}', ${tIdx}, this.checked)" style="width:18px; height:18px; cursor:pointer;">
                                                <span>${t.title}</span>
                                            </div>
                                            <div style="display:flex; gap:8px; align-items:center;">
                                                ${t.kpi ? '<span style="font-size:11px; background:rgba(16,185,129,0.15); color:#34d399; padding:2px 8px; border-radius:6px; font-weight:800;">KPI: ' + t.kpi + '</span>' : ''}
                                                <span style="font-size:11px; background:rgba(59,130,246,0.15); color:#60a5fa; padding:2px 8px; border-radius:6px; font-weight:800;">${t.week || 'أسبوع'}</span>
                                            </div>
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:10px;">
                            <button type="button" onclick="tgOpenEditMonthlyPlanModal('${p.id}')" class="bt" style="background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#fff; font-size:12.5px; padding:8px 20px; font-weight:900; border:none; border-radius:20px; box-shadow:0 4px 12px rgba(59,130,246,0.35); cursor:pointer;">✏️ تعديل الخطة</button>
                            <button type="button" onclick="tgPrintMonthlyPlan('${p.id}')" class="bt bt-o" style="font-size:12.5px; padding:8px 20px; font-weight:800; border-radius:20px;">🖨 طباعة الخطة MP</button>
                        </div>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    }, function(err) {
        listEl.innerHTML = '<div style="color:var(--no); text-align:center;">تعذر التحميل: ' + err.message + '</div>';
    });
};

window.tgToggleEmpPlanTaskDone = function(planId, taskIndex, isDone) {
    if (!window.db || !planId) return;
    db.collection('monthly_plans').doc(planId).get().then(function(doc) {
        if (!doc.exists) return;
        var p = doc.data();
        var tasks = p.tasks || [];
        if (tasks[taskIndex]) {
            tasks[taskIndex].done = !!isDone;
            var completedCount = tasks.filter(function(t){ return t.done; }).length;
            var progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
            return db.collection('monthly_plans').doc(planId).update({
                tasks: tasks,
                progress: progress
            }).then(function() {
                if (typeof tgToast === 'function') tgToast('✅ تم تحديث حالة الإنجاز', 'ok');
                tgRenderMonthlyPlansEmp();
            });
        }
    });
};



window.loadMonthlyPlansEmp = function(container) {
    if (!container) container = document.getElementById('epg-monthlyplans');
    if (!container) return;

    container.innerHTML = `
        <div class="set-sec">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:20px; border-bottom:1.5px solid var(--bd); padding-bottom:14px;">
                <div>
                    <h2 style="font-size:22px; font-weight:900; color:var(--tx); margin:0 0 4px;">🎯 خطتي الشهرية وخطط العمل (Monthly Plans - MP)</h2>
                    <p style="color:var(--tx2); font-size:13.5px; margin:0; font-weight:600;">إعداد وتقديم خطتك الشهرية وتحديد مستهدفاتك ومتابعة نسبة الإنجاز والاعتماد.</p>
                </div>
                <button type="button" onclick="tgOpenEmployeeNewMonthlyPlanModal()" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-weight:900; font-size:13.5px; padding:11px 24px; border-radius:30px; box-shadow:0 6px 20px rgba(16,185,129,0.35); border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                    <span>➕</span> تقديم خطة شهرية جديدة للإدارة
                </button>
            </div>

            <div id="mpEmpList">
                <div style="text-align:center; padding:35px; color:var(--tx2); font-weight:bold;">⏳ جاري تحميل خططك الشهرية...</div>
            </div>
        </div>
    `;

    tgRenderMonthlyPlansEmp();
};



window.tgOpenEmployeeNewMonthlyPlanModal = function() {
    var modalId = 'empNewMpModalOverlay';
    if (document.getElementById(modalId)) document.getElementById(modalId).remove();

    var u = window.TG_USER || {};
    var todayMonth = new Date().toISOString().substring(0, 7);

    var html = `
    <div id="${modalId}" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.85); z-index:999999; display:flex; justify-content:center; align-items:center; padding:16px; backdrop-filter:blur(10px); font-family:sans-serif; direction:rtl; text-align:right;">
        <div style="background:var(--bg2); border:1.5px solid var(--bd); border-radius:20px; width:100%; max-width:680px; max-height:90vh; overflow-y:auto; box-shadow:0 25px 50px rgba(0,0,0,0.4); display:flex; flex-direction:column;">
            
            <div style="padding:18px 24px; border-bottom:1px solid var(--bd); display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02)); border-radius:20px 20px 0 0;">
                <div>
                    <h3 style="margin:0; font-size:20px; font-weight:900; color:var(--tx);">➕ إعداد وتقديم خطتي الشهرية للإدارة (MP)</h3>
                    <p style="margin:4px 0 0; color:var(--tx2); font-size:13px; font-weight:600;">حدد مستهدفات عملك الشهرية والأسبوعية ومؤشرات النجاح KPI.</p>
                </div>
                <button type="button" onclick="document.getElementById('${modalId}').remove()" style="background:none; border:none; color:var(--tx2); font-size:22px; cursor:pointer; font-weight:bold;">✕</button>
            </div>

            <div style="padding:22px; display:flex; flex-direction:column; gap:16px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                    <div>
                        <label style="font-size:13px; font-weight:800; color:var(--tx); display:block; margin-bottom:6px;">عنوان الخطة</label>
                        <input type="text" id="empMpTitle" placeholder="مثلاً: خطة عمل شهر أغسطس 2026" value="خطة شهر ${new Date().toLocaleString('ar-EG', {month:'long'})}" style="width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid var(--bd); background:var(--bg); color:var(--tx); outline:none; font-weight:700;">
                    </div>
                    <div>
                        <label style="font-size:13px; font-weight:800; color:var(--tx); display:block; margin-bottom:6px;">الشهر المستهدف</label>
                        <input type="month" id="empMpMonth" value="${todayMonth}" style="width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid var(--bd); background:var(--bg); color:var(--tx); outline:none; font-weight:700;">
                    </div>
                </div>

                <div>
                    <label style="font-size:13px; font-weight:800; color:var(--tx); display:block; margin-bottom:6px;">الخلاصة والهدف الاستراتيجي من الخطة</label>
                    <textarea id="empMpObjectives" rows="3" placeholder="ملخص أهدافك ومستهدفاتك لهذا الشهر..." style="width:100%; padding:12px 14px; border-radius:10px; border:1.5px solid var(--bd); background:var(--bg); color:var(--tx); outline:none; font-weight:600; line-height:1.6;"></textarea>
                </div>

                <div style="border-top:1px dashed var(--bd); padding-top:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <strong style="color:#10b981; font-size:14px; font-weight:900;">📋 بنود ومستهدفات الخطة التفصيلية:</strong>
                        <button type="button" onclick="tgAddEmpMpTaskRow()" class="bt bt-o" style="padding:4px 14px; font-size:12px; font-weight:800; border-radius:20px;">➕ إضافة بند/هدف</button>
                    </div>

                    <div id="empMpTasksBox" style="display:flex; flex-direction:column; gap:10px;">
                        <!-- Default rows -->
                    </div>
                </div>
            </div>

            <div style="padding:16px 24px; background:var(--bg); border-top:1px solid var(--bd); display:flex; justify-content:flex-end; gap:12px; border-radius:0 0 20px 20px;">
                <button type="button" onclick="document.getElementById('${modalId}').remove()" style="background:#334155; color:#fff; border:none; padding:10px 22px; border-radius:30px; font-weight:bold; cursor:pointer;">إلغاء</button>
                <button type="button" onclick="tgSubmitEmployeeMonthlyPlan()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:10px 28px; border-radius:30px; font-weight:900; box-shadow:0 4px 15px rgba(16,185,129,0.4); cursor:pointer;">📨 إرسال الخطة للإدارة</button>
            </div>
        </div>
    </div>
    `;

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    tgAddEmpMpTaskRow();
    tgAddEmpMpTaskRow();
    tgAddEmpMpTaskRow();
};

window.tgAddEmpMpTaskRow = function() {
    var box = document.getElementById('empMpTasksBox');
    if (!box) return;

    var rowId = 'empMpRow_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    var row = document.createElement('div');
    row.id = rowId;
    row.style.cssText = 'display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:8px; align-items:center; background:var(--bg2); padding:10px; border-radius:12px; border:1px solid var(--bd);';
    row.innerHTML = `
        <input type="text" placeholder="اسم الهدف / البند التنفيذي" class="emp-mp-t-title" style="padding:8px 12px; border-radius:8px; border:1px solid var(--bd); background:var(--bg); color:var(--tx); font-weight:600; outline:none; font-size:13px;">
        <select class="emp-mp-t-week" style="padding:8px; border-radius:8px; border:1px solid var(--bd); background:var(--bg); color:var(--tx); font-weight:600; outline:none; font-size:12.5px;">
            <option value="الأسبوع 1">الأسبوع 1</option>
            <option value="الأسبوع 2">الأسبوع 2</option>
            <option value="الأسبوع 3">الأسبوع 3</option>
            <option value="الأسبوع 4">الأسبوع 4</option>
            <option value="طوال الشهر">طوال الشهر</option>
        </select>
        <input type="text" placeholder="مؤشر KPI (مثلاً: 100%)" class="emp-mp-t-kpi" style="padding:8px 12px; border-radius:8px; border:1px solid var(--bd); background:var(--bg); color:var(--tx); font-weight:600; outline:none; font-size:12.5px;">
        <button type="button" onclick="document.getElementById('${rowId}').remove()" style="background:rgba(239,68,68,0.15); color:#ef4444; border:none; padding:8px 10px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:12px;">🗑</button>
    `;
    box.appendChild(row);
};

window.tgSubmitEmployeeMonthlyPlan = function() {
    var title = document.getElementById('empMpTitle') ? document.getElementById('empMpTitle').value.trim() : '';
    var monthYear = document.getElementById('empMpMonth') ? document.getElementById('empMpMonth').value : '';
    var objectives = document.getElementById('empMpObjectives') ? document.getElementById('empMpObjectives').value.trim() : '';

    if (!title || !monthYear) {
        alert("يرجى إدخال عنوان الخطة واختيار الشهر المستهدف!");
        return;
    }

    var tasksBox = document.getElementById('empMpTasksBox');
    var tasks = [];
    if (tasksBox) {
        tasksBox.querySelectorAll('div[id^="empMpRow_"]').forEach(function(row) {
            var tTitle = row.querySelector('.emp-mp-t-title') ? row.querySelector('.emp-mp-t-title').value.trim() : '';
            var tWeek = row.querySelector('.emp-mp-t-week') ? row.querySelector('.emp-mp-t-week').value : 'الأسبوع 1';
            var tKpi = row.querySelector('.emp-mp-t-kpi') ? row.querySelector('.emp-mp-t-kpi').value.trim() : '';
            if (tTitle) {
                tasks.push({
                    title: tTitle,
                    week: tWeek,
                    kpi: tKpi,
                    done: false
                });
            }
        });
    }

    if (tasks.length === 0) {
        alert("يرجى إدخال بند أو هدف تنفيذي واحد على الأقل!");
        return;
    }

    var u = window.TG_USER || {};
    var myUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : '');
    var myName = u.name || u.displayName || 'موظف';
    var myDept = u.role || u.department || u.dept || 'قسم العمليات';

    if (!window.db) { alert("تعذر الاتصال بقاعدة البيانات!"); return; }

    db.collection('monthly_plans').add({
        uid: myUid,
        createdBy: myUid,
        creatorName: myName,
        userName: myName,
        department: myDept,
        userRole: myDept,
        title: title,
        monthYear: monthYear,
        objectives: objectives,
        tasks: tasks,
        progress: 0,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        if (document.getElementById('empNewMpModalOverlay')) document.getElementById('empNewMpModalOverlay').remove();
        
        if (typeof tgToast === 'function') tgToast('✅ تم إرسال الخطة الشهرية للإدارة بنجاح', 'ok');
        else alert('✅ تم إرسال الخطة الشهرية للإدارة بنجاح');

        if (typeof tgNotifyAdminsReportSubmitted === 'function') {
            tgNotifyAdminsReportSubmitted('🎯 خطة شهرية جديدة (MP)', myName, 'خطة شهرية جديدة: ' + title, 'monthly-plan-new');
        }

        tgRenderMonthlyPlansEmp();
    }).catch(function(err) {
        alert("حدث خطأ أثناء حفظ الخطة: " + err.message);
    });
};

// ─── EDIT MONTHLY PLAN MODAL & HANDLERS (HIGH CONTRAST REDESIGN) ──────────────────
window.tgOpenEditMonthlyPlanModal = function(planId) {
    if (!window.db || !planId) return;
    db.collection('monthly_plans').doc(planId).get().then(function(doc) {
        if (!doc.exists) {
            alert('❌ الخطة الشهرية غير موجودة');
            return;
        }
        var p = doc.data();
        p.id = doc.id;

        var modalId = 'editMpModalOverlay';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        var tasks = p.tasks || [];
        var tasksHTML = tasks.map(function(t) {
            return `
                <div class="edit-mp-task-row" style="display:grid; grid-template-columns:30px 1.5fr 1fr 120px 40px; gap:10px; align-items:center; background:#1e293b; padding:10px 14px; border-radius:10px; border:1px solid #334155; margin-bottom:10px;">
                    <input type="checkbox" class="edit-mp-task-done" ${t.done ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer; accent-color:#10b981;">
                    <input type="text" class="edit-mp-task-title" value="${(t.title || '').replace(/"/g, '&quot;')}" placeholder="عنوان البند/المهمة..." style="padding:8px 12px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#ffffff !important; font-size:13.5px; font-weight:600;">
                    <input type="text" class="edit-mp-task-kpi" value="${(t.kpi || '').replace(/"/g, '&quot;')}" placeholder="مؤشر KPI..." style="padding:8px 12px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#ffffff !important; font-size:13px; font-weight:600;">
                    <select class="edit-mp-task-week" style="padding:8px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#ffffff !important; font-size:13px; font-weight:600;">
                        <option value="الأسبوع 1" ${t.week === 'الأسبوع 1' ? 'selected' : ''}>الأسبوع 1</option>
                        <option value="الأسبوع 2" ${t.week === 'الأسبوع 2' ? 'selected' : ''}>الأسبوع 2</option>
                        <option value="الأسبوع 3" ${t.week === 'الأسبوع 3' ? 'selected' : ''}>الأسبوع 3</option>
                        <option value="الأسبوع 4" ${t.week === 'الأسبوع 4' ? 'selected' : ''}>الأسبوع 4</option>
                        <option value="طوال الشهر" ${t.week === 'طوال الشهر' ? 'selected' : ''}>طوال الشهر</option>
                    </select>
                    <button type="button" onclick="this.parentElement.remove()" style="background:rgba(244,63,94,0.18); color:#f43f5e; border:1px solid rgba(244,63,94,0.3); width:36px; height:36px; border-radius:8px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="حذف البند">✕</button>
                </div>
            `;
        }).join('');

        var html = `
        <div id="${modalId}" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(3,7,18,0.85); z-index:999999; display:flex; justify-content:center; align-items:center; padding:16px; backdrop-filter:blur(12px); font-family:'Readex Pro', sans-serif; direction:rtl; text-align:right;">
            <div style="background:#0f172a; border:2px solid #334155; border-radius:20px; width:100%; max-width:780px; max-height:90vh; overflow-y:auto; box-shadow:0 25px 60px rgba(0,0,0,0.8); display:flex; flex-direction:column;">
                
                <div style="padding:20px 28px; border-bottom:2px solid #334155; display:flex; justify-content:space-between; align-items:center; background:#1e293b; border-radius:18px 18px 0 0;">
                    <div>
                        <h3 style="margin:0; font-size:20px; font-weight:800; color:#ffffff !important;">✏️ تعديل الخطة الشهرية و KPIs</h3>
                        <p style="margin:4px 0 0; color:#38bdf8; font-size:13px; font-weight:600;">تعديل بنود الخطة والتواريخ ومؤشرات KPI بأعلى وضوح وتباين visual contrast</p>
                    </div>
                    <button type="button" onclick="document.getElementById('${modalId}').remove()" style="background:transparent; border:1px solid #334155; color:#ffffff; width:36px; height:36px; border-radius:10px; font-size:18px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">✕</button>
                </div>

                <form onsubmit="tgSaveEditedMonthlyPlan(event, '${p.id}')">
                    <div style="padding:26px 28px; display:flex; flex-direction:column; gap:18px;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                            <div>
                                <label style="font-size:13.5px; font-weight:700; color:#ffffff !important; display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                                    📌 عنوان الخطة <span style="color:#f43f5e;">*</span>
                                </label>
                                <input type="text" id="editMpTitle" value="${(p.title || '').replace(/"/g, '&quot;')}" required style="width:100%; padding:12px 16px; border-radius:10px; border:1px solid #334155; background:#1e293b; color:#ffffff !important; outline:none; font-weight:600; font-size:14px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);">
                            </div>
                            <div>
                                <label style="font-size:13.5px; font-weight:700; color:#ffffff !important; display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                                    📅 الشهر المستهدف <span style="color:#f43f5e;">*</span>
                                </label>
                                <input type="month" id="editMpMonth" value="${p.monthYear || ''}" required style="width:100%; padding:12px 16px; border-radius:10px; border:1px solid #334155; background:#1e293b; color:#ffffff !important; color-scheme:dark; outline:none; font-weight:600; font-size:14px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);">
                            </div>
                        </div>

                        <div>
                            <label style="font-size:13.5px; font-weight:700; color:#ffffff !important; display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                                🏢 القسم / الموظف
                            </label>
                            <input type="text" id="editMpDept" value="${(p.department || p.targetName || p.creatorName || '').replace(/"/g, '&quot;')}" style="width:100%; padding:12px 16px; border-radius:10px; border:1px solid #334155; background:#1e293b; color:#ffffff !important; outline:none; font-weight:600; font-size:14px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);">
                        </div>

                        <div>
                            <label style="font-size:13.5px; font-weight:700; color:#ffffff !important; display:flex; align-items:center; gap:6px; margin-bottom:8px;">
                                🎯 الملخص والرؤية الاستراتيجية
                            </label>
                            <textarea id="editMpObjectives" rows="3" style="width:100%; padding:12px 16px; border-radius:10px; border:1px solid #334155; background:#1e293b; color:#ffffff !important; outline:none; font-weight:600; line-height:1.6; resize:vertical; font-size:14px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);">${p.objectives || p.execSummary || ''}</textarea>
                        </div>

                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-top:14px; border-top:2px solid #334155;">
                                <label style="font-size:14px; font-weight:800; color:#ffffff !important;">📌 بنود وقائمة تنفيذ الخطة الإجرائية</label>
                                <button type="button" onclick="tgAddEditMpTaskRow()" style="font-size:13px; padding:7px 16px; border-radius:10px; font-weight:700; cursor:pointer; background:rgba(16,185,129,0.18); color:#34d399; border:1px solid #10b981;">➕ إضافة بند جديدة</button>
                            </div>
                            <div id="editMpTasksContainer">
                                ${tasksHTML}
                            </div>
                        </div>
                    </div>

                    <div style="padding:20px 28px; border-top:2px solid #334155; display:flex; justify-content:flex-end; gap:14px; background:#1e293b; border-radius:0 0 18px 18px;">
                        <button type="button" onclick="document.getElementById('${modalId}').remove()" style="padding:10px 24px; border-radius:10px; font-weight:700; background:transparent; color:#ffffff; border:1px solid #334155; cursor:pointer;">إلغاء</button>
                        <button type="submit" style="background:linear-gradient(135deg, #2563eb, #3b82f6); color:#ffffff; padding:10px 32px; border-radius:10px; font-weight:800; border:none; box-shadow:0 4px 18px rgba(59,130,246,0.4); cursor:pointer; font-size:14.5px;">💾 حفظ التعديلات</button>
                    </div>
                </form>
            </div>
        </div>
        `;

        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
    }).catch(function(err) {
        alert('❌ خطأ في تحميل الخطة: ' + err.message);
    });
};

window.tgAddEditMpTaskRow = function() {
    var container = document.getElementById('editMpTasksContainer');
    if (!container) return;
    var row = document.createElement('div');
    row.className = 'edit-mp-task-row';
    row.style.cssText = 'display:grid; grid-template-columns:30px 1.5fr 1fr 120px 40px; gap:10px; align-items:center; background:#1e293b; padding:10px 14px; border-radius:10px; border:1px solid #334155; margin-bottom:10px;';
    row.innerHTML = `
        <input type="checkbox" class="edit-mp-task-done" style="width:20px; height:20px; cursor:pointer; accent-color:#10b981;">
        <input type="text" class="edit-mp-task-title" placeholder="عنوان البند/المهمة..." style="padding:8px 12px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#ffffff !important; font-size:13.5px; font-weight:600;">
        <input type="text" class="edit-mp-task-kpi" placeholder="مؤشر KPI..." style="padding:8px 12px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#ffffff !important; font-size:13px; font-weight:600;">
        <select class="edit-mp-task-week" style="padding:8px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:#ffffff !important; font-size:13px; font-weight:600;">
            <option value="الأسبوع 1">الأسبوع 1</option>
            <option value="الأسبوع 2">الأسبوع 2</option>
            <option value="الأسبوع 3">الأسبوع 3</option>
            <option value="الأسبوع 4">الأسبوع 4</option>
            <option value="طوال الشهر">طوال الشهر</option>
        </select>
        <button type="button" onclick="this.parentElement.remove()" style="background:rgba(244,63,94,0.18); color:#f43f5e; border:1px solid rgba(244,63,94,0.3); width:36px; height:36px; border-radius:8px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="حذف البند">✕</button>
    `;
    container.appendChild(row);
};

window.tgSaveEditedMonthlyPlan = function(event, planId) {
    event.preventDefault();
    if (!window.db || !planId) return;

    var title = document.getElementById('editMpTitle').value.trim();
    var monthYear = document.getElementById('editMpMonth').value.trim();
    var department = document.getElementById('editMpDept').value.trim();
    var objectives = document.getElementById('editMpObjectives').value.trim();

    var rows = document.querySelectorAll('.edit-mp-task-row');
    var tasks = [];
    rows.forEach(function(row) {
        var isDone = row.querySelector('.edit-mp-task-done').checked;
        var taskTitle = row.querySelector('.edit-mp-task-title').value.trim();
        var kpi = row.querySelector('.edit-mp-task-kpi').value.trim();
        var week = row.querySelector('.edit-mp-task-week').value;
        if (taskTitle) {
            tasks.push({
                title: taskTitle,
                kpi: kpi,
                week: week,
                done: isDone
            });
        }
    });

    db.collection('monthly_plans').doc(planId).update({
        title: title,
        monthYear: monthYear,
        department: department,
        objectives: objectives,
        execSummary: objectives,
        tasks: tasks,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        if (document.getElementById('editMpModalOverlay')) document.getElementById('editMpModalOverlay').remove();
        if (typeof tgShowToast === 'function') {
            tgShowToast('✅ تم حفظ تعديلات الخطة الشهرية بنجاح!');
        } else {
            alert('✅ تم حفظ تعديلات الخطة الشهرية بنجاح!');
        }
        if (typeof tgRenderMonthlyPlansAdmin === 'function') tgRenderMonthlyPlansAdmin();
        if (typeof loadMonthlyPlansEmp === 'function') loadMonthlyPlansEmp();
    }).catch(function(err) {
        alert('❌ خطأ أثناء حفظ التعديلات: ' + err.message);
    });
};

    var completedCount = tasks.filter(function(t){ return t.done; }).length;
    var progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    var updateData = {
        title: title,
        monthYear: monthYear,
        department: department,
        objectives: objectives,
        tasks: tasks,
        progress: progress,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('monthly_plans').doc(planId).update(updateData).then(function() {
        if (typeof tgToast === 'function') tgToast('✅ تم حفظ تعديلات الخطة الشهرية بنجاح', 'ok');
        else alert('✅ تم حفظ التعديلات بنجاح');

        var overlay = document.getElementById('editMpModalOverlay');
        if (overlay) overlay.remove();

        if (typeof tgRenderMonthlyPlansAdmin === 'function') tgRenderMonthlyPlansAdmin();
        if (typeof tgRenderMonthlyPlansEmp === 'function') tgRenderMonthlyPlansEmp();
    }).catch(function(err) {
        alert('❌ فشل حفظ التعديلات: ' + err.message);
    });
};

// ─── AUTO-GENERATE MONTHLY REPORT FROM WEEKLY REPORTS ────────────────────
window.tgGenerateMonthlyFromWeekly = function(targetMonthStr) {
    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) { alert('❌ تعذر الاتصال بقاعدة البيانات.'); return; }

    var u = window.TG_USER || {};
    var myUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : '');
    if (!myUid) { alert('❌ من فضلك سجل الدخول أولاً'); return; }

    var now = new Date();
    targetMonthStr = targetMonthStr || (now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'));

    var p1 = targetDb.collection('weekly_reports').where('uid', '==', myUid).get().catch(function(){ return {docs:[]}; });
    var p2 = targetDb.collection('weeklyReports').where('uid', '==', myUid).get().catch(function(){ return {docs:[]}; });

    Promise.all([p1, p2]).then(function(results) {
        var weeklyReports = [];
        var seenIds = {};

        results.forEach(function(snap) {
            if (snap && snap.docs) {
                snap.docs.forEach(function(doc) {
                    if (!seenIds[doc.id]) {
                        seenIds[doc.id] = true;
                        var d = doc.data();
                        d.id = doc.id;
                        weeklyReports.push(d);
                    }
                });
            }
        });

        if (weeklyReports.length === 0) {
            var emptyModalId = 'tgEmptyWrModal';
            if (document.getElementById(emptyModalId)) document.getElementById(emptyModalId).remove();

            var emptyHtml = `
            <div id="${emptyModalId}" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.92); z-index:999999; display:flex; justify-content:center; align-items:center; padding:16px; backdrop-filter:blur(12px); font-family:'Alexandria','Cairo',sans-serif; direction:rtl; text-align:right;">
                <div style="background:#1e293b; border:2px solid #3b82f6; border-radius:24px; width:100%; max-width:560px; padding:32px 28px; box-shadow:0 25px 60px rgba(0,0,0,0.6); text-align:center; color:#ffffff;">
                    <div style="font-size:52px; margin-bottom:14px; text-shadow:0 4px 15px rgba(0,0,0,0.4);">📊</div>
                    <h3 style="font-size:22px; font-weight:900; color:#ffffff !important; margin:0 0 14px; letter-spacing:-0.3px;">لا توجد تقارير أسبوعية مسجلة بعد</h3>
                    <p style="font-size:15px; color:#cbd5e1 !important; margin:0 0 26px; line-height:1.7; font-weight:700;">لكي تتولّد التقرير الشهري تلقائياً، يرجى تقديم تقرير أسبوعي واحد على الأقل أولاً بالضغط على زر <b style="color:#38bdf8;">"➕ تقديم تقرير أسبوعي جديد"</b>.</p>
                    <div style="display:flex; gap:12px; justify-content:center;">
                        <button type="button" onclick="document.getElementById('${emptyModalId}').remove()" class="bt" style="background:#334155; color:#ffffff !important; padding:12px 28px; border-radius:50px; font-weight:900; border:1px solid rgba(255,255,255,0.2); cursor:pointer; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">إغلاق النافذة</button>
                        <button type="button" onclick="document.getElementById('${emptyModalId}').remove(); if(typeof tgOpenNewWeeklyReportModal==='function') tgOpenNewWeeklyReportModal();" class="bt" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#ffffff !important; padding:12px 28px; border-radius:50px; font-weight:900; border:none; cursor:pointer; font-size:14px; box-shadow:0 4px 18px rgba(2,132,199,0.45);">➕ تقديم تقرير أسبوعي الآن</button>
                    </div>
                </div>
            </div>
            `;
            var div = document.createElement('div');
            div.innerHTML = emptyHtml;
            document.body.appendChild(div.firstElementChild);
            return;
        }

        weeklyReports.sort(function(a, b) {
            var tA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
            var tB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
            return tA - tB;
        });

        // Auto-detect target month from the latest weekly report if not specified
        if (!targetMonthStr || typeof targetMonthStr !== 'string') {
            var latestReport = weeklyReports[weeklyReports.length - 1];
            targetMonthStr = window.tgExtractMonthFromWeeklyReport(latestReport);
        }

        // Filter weekly reports for the target month (or include all if matching month)
        var monthReports = weeklyReports.filter(function(r) {
            var rMonth = window.tgExtractMonthFromWeeklyReport(r);
            return rMonth === targetMonthStr;
        });
        if (monthReports.length === 0) monthReports = weeklyReports; // fallback

        var monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        var mYearParts = String(targetMonthStr).split('-');
        var displayMonthName = targetMonthStr;
        if (mYearParts.length === 2) {
            var mIdx = parseInt(mYearParts[1], 10) - 1;
            if (monthNamesAr[mIdx]) displayMonthName = monthNamesAr[mIdx] + ' ' + mYearParts[0];
        }

        var summaryText = "📊 التقرير الشهري التلقائي لشهر (" + displayMonthName + "):\n\n" +
            monthReports.map(function(r, idx) {
                var wTitle = r.weekYear ? ('🗓️ ' + (typeof tgFormatWeekName==='function'?tgFormatWeekName(r.weekYear):r.weekYear)) : (r.weekStart ? ('🗓️ أسبوع (' + r.weekStart + ')') : ('🗓️ تقرير أسبوعي #' + (idx + 1)));
                return wTitle + ":\n" + (r.content || 'لا يوجد ملخص');
            }).join("\n\n-----------------------------------\n\n");

        targetDb.collection('monthly_reports').where('uid', '==', myUid).get().then(function(mrSnap) {
            var existingDoc = null;
            mrSnap.forEach(function(d) {
                if (d.data().monthYear === targetMonthStr) existingDoc = d;
            });

            var reportData = {
                uid: myUid,
                userName: u.name || 'موظف',
                monthYear: targetMonthStr,
                achievements: summaryText,
                status: 'pending',
                autoGenerated: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            var onComplete = function() {
                // إشعار الأدمن والإدارة بتوليد وإرسال التقرير الشهري
                if (typeof tgNotifyAdminsReportSubmitted === 'function') {
                    tgNotifyAdminsReportSubmitted('📄 تقرير شهري جديد (MR)', u.name || 'موظف', 'تم توليد وإرسال التقرير الشهري تلقائياً لشهر ' + displayMonthName, 'monthly-report-new');
                } else if (typeof tgNotifyAdmins === 'function') {
                    tgNotifyAdmins('📄 تقرير شهري جديد لموظف', 'قام الموظف ' + (u.name||'موظف') + ' بتوليد وإرسال تقريره الشهري لشهر ' + displayMonthName, 'monthly-report-new');
                }

                var modalId = 'tgGenMrSuccessModal';
                if (document.getElementById(modalId)) document.getElementById(modalId).remove();

                var safeSummary = summaryText.replace(/`/g, '\\`').replace(/\$/g, '\\$');

                var successHtml = `
                <div id="${modalId}" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.88); z-index:999999; display:flex; justify-content:center; align-items:center; padding:16px; backdrop-filter:blur(12px); font-family:sans-serif; direction:rtl; text-align:right;">
                    <div style="background:#1e293b; border:2px solid #334155; border-radius:22px; width:100%; max-width:700px; max-height:90vh; overflow-y:auto; padding:26px; box-shadow:0 25px 60px rgba(0,0,0,0.6); display:flex; flex-direction:column; color:#f8fafc;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; border-bottom:1.5px solid #334155; padding-bottom:14px;">
                            <div>
                                <h3 style="margin:0 0 6px; font-size:22px; font-weight:900; color:#34d399; display:flex; align-items:center; gap:8px;">
                                    ⚡ تم توليد التقرير الشهري وإرساله للإدارة بنجاح!
                                </h3>
                                <p style="margin:0; font-size:14px; color:#cbd5e1; font-weight:700;">تم تجميع ${monthReports.length} تقرير أسبوعي لشهر (${displayMonthName}) وتحديث التقرير الشهري تلقائياً.</p>
                            </div>
                            <button type="button" onclick="document.getElementById('${modalId}').remove()" style="background:rgba(255,255,255,0.1); border:none; color:#f8fafc; font-size:20px; cursor:pointer; font-weight:bold; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">✕</button>
                        </div>

                        <div style="background:rgba(16,185,129,0.15); border:1.5px solid rgba(16,185,129,0.4); padding:12px 16px; border-radius:12px; font-size:13.5px; color:#34d399; margin-bottom:16px; font-weight:bold; display:flex; align-items:center; gap:8px;">
                            <span>📩</span> تم الالتقاط التلقائي لشهر (${displayMonthName}) وإرسال التقرير رسمياً إلى لوحة الأدمن.
                        </div>

                        <div style="background:#ffffff; border:2px solid #3b82f6; padding:18px; border-radius:14px; font-size:14.5px; line-height:1.8; color:#0f172a; white-space:pre-line; max-height:360px; overflow-y:auto; font-weight:700; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                            ${summaryText}
                        </div>

                        <div style="margin-top:22px; display:flex; justify-content:flex-end; gap:12px; flex-wrap:wrap; border-top:1.5px solid #334155; padding-top:16px;">
                            <button type="button" onclick="tgPrintMonthlyReport(null, \`${safeSummary}\`, '${displayMonthName}')" class="bt" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; padding:11px 24px; border-radius:30px; font-weight:900; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 14px rgba(2,132,199,0.35);">
                                <span>🖨</span> طباعة التقرير MR
                            </button>
                            <button type="button" onclick="document.getElementById('${modalId}').remove()" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; padding:11px 28px; border-radius:30px; font-weight:900; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.35);">
                                موافق وحفظ
                            </button>
                        </div>
                    </div>
                </div>
                `;
                var div = document.createElement('div');
                div.innerHTML = successHtml;
                document.body.appendChild(div.firstElementChild);

                if (typeof tgRenderWeeklyReportsEmp === 'function') tgRenderWeeklyReportsEmp();
                if (typeof tgRenderMonthlyReportsEmp === 'function') tgRenderMonthlyReportsEmp();
            };

            if (existingDoc) {
                targetDb.collection('monthly_reports').doc(existingDoc.id).update(reportData).then(onComplete);
            } else {
                reportData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                targetDb.collection('monthly_reports').add(reportData).then(onComplete);
            }
        });
    }).catch(function(err) {
        alert('❌ حدث خطأ أثناء التوليد: ' + err.message);
    });
};

// ─── Weekly Reports Handler (WR) ──────────────────────────────────────────

// Admin View for Unified Reports (Weekly & Monthly)
window.loadWeeklyReportsAdmin = function(container) {
    if (!container) container = document.getElementById('pg-wkr') || document.getElementById('pg-weeklyreports');
    if (!container) return;

    container.innerHTML = `
        <div class="set-sec">
            <!-- Centralized Reports Hub Switcher Bar -->
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:22px; background:var(--bg2); padding:10px; border-radius:18px; border:1.5px solid var(--bd); box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                <button type="button" onclick="go('wkr')" class="bt" style="flex:1; min-width:150px; background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; font-weight:900; font-size:14px; padding:12px; border-radius:12px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.3); display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span>📊</span> التقارير (أسبوعية وشهرية مدمجة)
                </button>
                <button type="button" onclick="go('monthlyplans')" class="bt" style="flex:1; min-width:150px; background:transparent; color:var(--tx); font-weight:800; font-size:14px; padding:12px; border-radius:12px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span>🎯</span> الخطط الشهرية (MP)
                </button>
            </div>

            <!-- Page Title & Actions -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:24px; padding-bottom:16px; border-bottom:1.5px solid var(--bd);">
                <div>
                    <h2 style="font-size:24px; font-weight:900; color:var(--tx); margin:0 0 6px;">📊 إدارة التقارير (أسبوعية وشهرية مدمجة للإدارة)</h2>
                    <p style="color:var(--tx2); font-size:14px; margin:0; font-weight:600;">سجل متابعة واعتماد التقارير الأسبوعية والشهرية المقدمة من الموظفين والأقسام.</p>
                </div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <button type="button" onclick="sendWeeklyReportReminder()" class="bt" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; font-weight:900; font-size:14px; padding:12px 24px; border-radius:50px; box-shadow:0 6px 20px rgba(99,102,241,0.35); border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px;" id="sysrepReminderBtn">
                        <span>🔔</span> تذكير الموظفين بالتقرير الأسبوعي (الخميس)
                    </button>
                    <button type="button" onclick="tgGenerateMasterExecutiveReportModal()" class="bt" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; font-weight:900; font-size:14px; padding:12px 24px; border-radius:50px; box-shadow:0 6px 20px rgba(245,158,11,0.35); border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                        <span>✨</span> إنشاء التقرير الشهري التجميعي للإدارة
                    </button>
                    <button type="button" onclick="tgOpenNewMonthlyReportModal()" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-weight:900; font-size:14px; padding:12px 24px; border-radius:50px; box-shadow:0 6px 20px rgba(16,185,129,0.35); border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                        <span>➕</span> إنشاء تقرير شهري مخصص
                    </button>
                </div>
            </div>

            <!-- Section 1: Monthly Reports (MR) -->
            <div style="margin-bottom:35px;">
                <h3 style="font-size:18px; font-weight:900; color:#10b981; margin:0 0 14px; display:flex; align-items:center; gap:8px;">
                    <span>📄</span> التقارير الشهرية المقدمة من الموظفين (MR)
                </h3>
                <div id="mrAdminListInUnified">
                    <div style="text-align:center; padding:25px; color:var(--tx2); font-weight:bold;">⏳ جاري تحميل التقارير الشهرية...</div>
                </div>
            </div>

            <!-- Section 2: Weekly Reports (WR) -->
            <div>
                <h3 style="font-size:18px; font-weight:900; color:#0284c7; margin:0 0 14px; display:flex; align-items:center; gap:8px;">
                    <span>🗓️</span> التقارير الأسبوعية المقدمة من الموظفين (WR)
                </h3>
                <div id="wkrAdminList">
                    <div style="text-align:center; padding:25px; color:var(--tx2); font-weight:bold;">⏳ جاري تحميل التقارير الأسبوعية...</div>
                </div>
            </div>
        </div>
    `;

    tgRenderMonthlyReportsAdminInUnified();
    tgRenderWeeklyReportsAdmin();
};

window.tgRenderMonthlyReportsAdminInUnified = function() {
    var listEl = document.getElementById('mrAdminListInUnified') || document.getElementById('mrAdminList');
    if (!listEl) return;
    if (!window.db) return;

    db.collection('monthly_reports').get().then(function(snap) {
        if (snap.empty) {
            listEl.innerHTML = `
                <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:30px; text-align:center; border-radius:14px; color:var(--tx2); font-weight:bold; font-size:14px;">
                    📄 لا توجد تقارير شهرية مسجلة حالياً.
                </div>
            `;
            return;
        }

        var reports = [];
        snap.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            reports.push(data);
        });

        reports.sort(function(a, b) {
            var tA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : (a.updatedAt && a.updatedAt.seconds ? a.updatedAt.seconds : 0);
            var tB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : (b.updatedAt && b.updatedAt.seconds ? b.updatedAt.seconds : 0);
            return tB - tA;
        });

        var html = `
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-bottom:14px;">
                <button type="button" onclick="tgExpandAllCards('mrAdminListInUnified')" class="bt bt-o" style="font-size:12px; padding:6px 14px; border-radius:20px; font-weight:800;">📂 فتح جميع الكروت</button>
                <button type="button" onclick="tgCollapseAllCards('mrAdminListInUnified')" class="bt bt-o" style="font-size:12px; padding:6px 14px; border-radius:20px; font-weight:800;">📁 طي جميع الكروت</button>
            </div>
        `;

        reports.forEach(function(r) {
            var isExecMaster = (r.type === 'executive_master');
            var statusBadge = '';
            if (isExecMaster) statusBadge = '<span class="badge" style="background:rgba(245,158,11,0.25); color:#fbbf24; border:1.5px solid #f59e0b; font-weight:900; padding:4px 14px; border-radius:20px;">✨ تقرير شامل</span>';
            else if (r.status === 'approved') statusBadge = '<span class="badge" style="background:rgba(16,185,129,0.2); color:#34d399; border:1.5px solid #10b981; font-weight:800; padding:4px 14px; border-radius:20px;">✅ معتمد</span>';
            else if (r.status === 'rejected') statusBadge = '<span class="badge" style="background:rgba(239,68,68,0.2); color:#f87171; border:1.5px solid #ef4444; font-weight:800; padding:4px 14px; border-radius:20px;">❌ يحتاج تعديل</span>';
            else statusBadge = '<span class="badge" style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1.5px solid #f59e0b; font-weight:800; padding:4px 14px; border-radius:20px;">🕒 قيد المراجعة</span>';

            var bodyId = 'mrBody_' + r.id;

            html += `
                <div id="mrCard_${r.id}" class="card p-3 mb-3" style="background:var(--bg2); border:1.5px solid var(--bd); border-radius:18px; box-shadow:0 4px 20px rgba(0,0,0,0.06); padding:16px 20px; margin-bottom:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <h3 style="font-size:15.5px; font-weight:900; color:var(--tx); margin:0; display:flex; align-items:center; gap:6px;">
                                📌 تقرير شهر (${r.monthYear || ''})
                                ${r.autoGenerated ? '<span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.4); font-size:11px; padding:2px 8px; border-radius:12px; font-weight:800;">⚡ مولد تلقائياً</span>' : ''}
                            </h3>
                            <span style="background:rgba(59,130,246,0.12); color:#3b82f6; border:1px solid rgba(59,130,246,0.3); font-size:12px; padding:4px 12px; border-radius:20px; font-weight:700;">
                                👤 الموظف (الراسل): ${r.userName || 'موظف'} (${r.userRole || 'عضو بالمؤسسة'})
                            </span>
                            <span style="background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.3); font-size:12px; padding:4px 12px; border-radius:20px; font-weight:700;">
                                🏢 القسم: ${r.department || 'قسم عام'}
                            </span>
                            ${statusBadge}
                        </div>

                        <div>
                            <button type="button" onclick="tgToggleCardDetails('${bodyId}', this)" class="bt tg-toggle-btn" style="background:var(--bg); border:1.5px solid var(--bd); color:var(--tx); font-size:12.5px; padding:6px 16px; border-radius:30px; font-weight:800; cursor:pointer;">
                                🔻 عرض التفاصيل والبنود
                            </button>
                        </div>
                    </div>

                    <div id="${bodyId}" class="tg-card-body" style="display:none; margin-top:16px; border-top:1.5px dashed var(--bd); padding-top:16px;">
                        <div style="background:var(--bg); padding:16px; border-radius:12px; border:1.5px solid var(--bd); margin-bottom:14px; white-space:pre-line; line-height:1.7; color:var(--tx); font-weight:600; font-size:13.5px; max-height:260px; overflow-y:auto;">
                            ${r.achievements || 'لم يذكر ملخص'}
                        </div>

                        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; align-items:center; border-top:1px solid var(--bd); padding-top:12px;">
                            <button type="button" onclick="tgPrintMonthlyReport('${r.id}')" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-size:13px; padding:8px 20px; font-weight:900; border:none; border-radius:50px; cursor:pointer;">🖨 طباعة التقرير MR</button>
                            ${r.status !== 'approved' ? `
                                <button type="button" onclick="tgApproveMonthlyReport('${r.id}')" class="bt" style="background:#10b981; color:#fff; font-size:13px; padding:8px 18px; font-weight:900; border-radius:50px; border:none; cursor:pointer;">✅ اعتماد التقرير</button>
                            ` : ''}
                            <button type="button" onclick="tgRejectMonthlyReportModal('${r.id}')" class="bt bt-o" style="border-color:#ef4444; color:#ef4444; font-size:13px; padding:8px 18px; font-weight:800; border-radius:50px; cursor:pointer;">✏️ إرجاع للتعديل</button>
                            <button type="button" onclick="tgDeleteMonthlyReport('${r.id}')" class="bt bt-o" style="border-color:#ef4444; color:#ef4444; font-size:13px; padding:8px 18px; font-weight:800; border-radius:50px; cursor:pointer;">🗑 حذف التقرير</button>
                        </div>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    }).catch(function(err) {
        listEl.innerHTML = `<div style="color:var(--tx2); padding:20px; text-align:center;">خطأ في التحميل: ${err.message}</div>`;
    });
};

window.tgRenderWeeklyReportsAdmin = function() {
    var listEl = document.getElementById('wkrAdminList');
    if (!listEl) return;
    if (!window.db) return;

    var p1 = db.collection('weekly_reports').get().catch(function(){ return {docs:[]}; });
    var p2 = db.collection('weeklyReports').get().catch(function(){ return {docs:[]}; });

    Promise.all([p1, p2]).then(function(results) {
        var reports = [];
        var seenIds = {};

        results.forEach(function(snap) {
            if (snap && snap.docs) {
                snap.docs.forEach(function(doc) {
                    if (!seenIds[doc.id]) {
                        seenIds[doc.id] = true;
                        var d = doc.data();
                        d.id = doc.id;
                        reports.push(d);
                    }
                });
            }
        });

        if (reports.length === 0) {
            listEl.innerHTML = `
                <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:35px; text-align:center; border-radius:16px; color:var(--tx2); font-weight:bold; font-size:14.5px;">
                    📊 لا توجد تقارير أسبوعية مسجلة حالياً.
                </div>
            `;
            return;
        }

        reports.sort(function(a, b) {
            var tA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : (a.createdAt && new Date(a.createdAt).getTime ? new Date(a.createdAt).getTime()/1000 : 0);
            var tB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : (b.createdAt && new Date(b.createdAt).getTime ? new Date(b.createdAt).getTime()/1000 : 0);
            return tB - tA;
        });

        var html = `
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-bottom:14px;">
                <button type="button" onclick="tgExpandAllCards('wkrAdminList')" class="bt bt-o" style="font-size:12px; padding:6px 14px; border-radius:20px; font-weight:800;">📂 فتح جميع الكروت</button>
                <button type="button" onclick="tgCollapseAllCards('wkrAdminList')" class="bt bt-o" style="font-size:12px; padding:6px 14px; border-radius:20px; font-weight:800;">📁 طي جميع الكروت</button>
            </div>
        `;

        reports.forEach(function(r) {
            var weekTitle = r.weekYear ? tgFormatWeekName(r.weekYear) : (r.weekStart ? ('أسبوع ' + r.weekStart) : 'تقرير أسبوعي');
            var statusBadge = '';
            if (r.status === 'approved') statusBadge = '<span class="badge" style="background:rgba(16,185,129,0.2); color:#34d399; border:1.5px solid #10b981; font-weight:800; padding:4px 14px; border-radius:20px;">✅ معتمد</span>';
            else if (r.status === 'rejected') statusBadge = '<span class="badge" style="background:rgba(239,68,68,0.2); color:#f87171; border:1.5px solid #ef4444; font-weight:800; padding:4px 14px; border-radius:20px;">❌ يحتاج تعديل</span>';
            else statusBadge = '<span class="badge" style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1.5px solid #f59e0b; font-weight:800; padding:4px 14px; border-radius:20px;">🕒 قيد المراجعة</span>';

            var bodyId = 'wrBody_' + r.id;

            html += `
                <div class="card p-3 mb-3" style="background:var(--bg2); border:1.5px solid var(--bd); border-radius:18px; box-shadow:0 4px 20px rgba(0,0,0,0.06); padding:16px 20px; margin-bottom:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <h3 style="font-size:15.5px; font-weight:900; color:var(--tx); margin:0; display:flex; align-items:center; gap:6px;">
                                📌 ${weekTitle}
                            </h3>
                            <span style="background:rgba(59,130,246,0.12); color:#3b82f6; border:1px solid rgba(59,130,246,0.3); font-size:12px; padding:4px 12px; border-radius:20px; font-weight:700;">
                                👤 الموظف (الراسل): ${r.userName || r.name || 'موظف'} (${r.userRole || 'عضو بالمؤسسة'})
                            </span>
                            <span style="background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.3); font-size:12px; padding:4px 12px; border-radius:20px; font-weight:700;">
                                🏢 القسم: ${r.department || 'قسم عام'}
                            </span>
                            ${statusBadge}
                        </div>

                        <div>
                            <button type="button" onclick="tgToggleCardDetails('${bodyId}', this)" class="bt tg-toggle-btn" style="background:var(--bg); border:1.5px solid var(--bd); color:var(--tx); font-size:12.5px; padding:6px 16px; border-radius:30px; font-weight:800; cursor:pointer;">
                                🔻 عرض التفاصيل والبنود
                            </button>
                        </div>
                    </div>

                    <div id="${bodyId}" class="tg-card-body" style="display:none; margin-top:16px; border-top:1.5px dashed var(--bd); padding-top:16px;">
                        <div style="background:var(--bg); padding:16px; border-radius:12px; border:1.5px solid var(--bd); margin-bottom:14px; white-space:pre-line; line-height:1.7; color:var(--tx); font-weight:600; font-size:13.5px; max-height:260px; overflow-y:auto;">
                            ${r.achievements || r.content || 'لم تذكر تفاصيل'}
                        </div>

                        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; align-items:center; border-top:1px solid var(--bd); padding-top:12px;">
                            <button type="button" onclick="tgPrintWeeklyReport('${r.id}')" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-size:13px; padding:8px 20px; font-weight:900; border:none; border-radius:50px; cursor:pointer;">🖨 طباعة التقرير WR</button>
                            ${r.status !== 'approved' ? `
                                <button type="button" onclick="tgApproveWeeklyReport('${r.id}')" class="bt" style="background:#10b981; color:#fff; font-size:13px; padding:8px 18px; font-weight:900; border:none; border-radius:50px; cursor:pointer;">✅ اعتماد التقرير</button>
                            ` : ''}
                            <button type="button" onclick="tgRejectWeeklyReportModal('${r.id}')" class="bt bt-o" style="border-color:#ef4444; color:#ef4444; font-size:13px; padding:8px 18px; font-weight:800; border-radius:50px; cursor:pointer;">✏️ إرجاع للتعديل</button>
                            <button type="button" onclick="tgDeleteWeeklyReport('${r.id}')" class="bt bt-o" style="border-color:#ef4444; color:#ef4444; font-size:13px; padding:8px 18px; font-weight:800; border-radius:50px; cursor:pointer;">🗑 حذف التقرير</button>
                        </div>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    }).catch(function(err) {
        listEl.innerHTML = `<div style="color:var(--tx2); padding:20px; text-align:center;">خطأ في التحميل: ${err.message}</div>`;
    });
};

// Employee View for Monthly Plans
window.loadMonthlyPlansEmp = function(container) {
    if (!container) container = document.getElementById('epg-monthlyplans');
    if (!container) return;

    container.innerHTML = `
        <div class="set-sec">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:20px;">
                <div>
                    <h2 style="font-size:22px; font-weight:900; color:var(--tx); margin:0 0 6px;">🎯 خطتي الشهرية الاستراتيجية (MP)</h2>
                    <p style="color:var(--tx); font-size:13px; margin:0; font-weight:600;">الخطط والمهام المستهدفة للشهر الحالي. يمكنك التعليم على المهام المكتملة لتحديث نسبة الإنجاز مباشرةً.</p>
                </div>
                <button type="button" onclick="tgOpenNewMonthlyPlanModal()" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-weight:900; font-size:14px; padding:10px 22px; border-radius:30px; box-shadow:0 4px 15px rgba(16,185,129,0.3);">
                    ➕ إنشاء خطة شهرية مخصصة
                </button>
            </div>

            <div id="mpEmpList">
                <div style="text-align:center; padding:30px; color:var(--tx); font-weight:bold;">جاري تحميل خطتك الشهرية...</div>
            </div>
        </div>
    `;

    tgRenderMonthlyPlansEmp();
};

window.tgRenderMonthlyPlansEmp = function(retryCount) {
    retryCount = retryCount || 0;
    var listEl = document.getElementById('mpEmpList');
    if (!listEl) return;

    var renderEmpty = function() {
        if (listEl && listEl.innerHTML.indexOf('جاري تحميل') !== -1) {
            listEl.innerHTML = `
                <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:40px; text-align:center; border-radius:14px; color:var(--tx); font-weight:800;">
                    🎯 لا توجد خطط شهرية متاحة حالياً.
                </div>
            `;
        }
    };

    var timer = setTimeout(renderEmpty, 1500);

    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) {
        if (retryCount < 10) setTimeout(function(){ tgRenderMonthlyPlansEmp(retryCount + 1); }, 300);
        else renderEmpty();
        return;
    }

    var u = window.TG_USER || {};
    var myUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : '');

    db.collection('monthly_plans').get().then(function(snap) {
        clearTimeout(timer);
        var plans = [];
        snap.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            // Strict user privacy scoping: Employee only sees their own monthly plans
            if (myUid && (data.uid === myUid || data.createdBy === myUid)) {
                plans.push(data);
            }
        });

        plans.sort(function(a, b) {
            var tA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
            var tB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
            return tB - tA;
        });

        var listEl = document.getElementById('mpEmpList');
        if (!listEl) return;

        if (plans.length === 0) {
            listEl.innerHTML = `
                <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:40px; text-align:center; border-radius:14px; color:var(--tx); font-weight:800;">
                    🎯 لا توجد خطط شهرية متاحة حالياً.
                </div>
            `;
            return;
        }

        var html = '';
        plans.forEach(function(p) {
            var tasks = p.tasks || [];
            var completedCount = tasks.filter(function(t){ return t.done; }).length;
            var progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

            html += `
                <div class="card p-3 mb-3" style="background:var(--bg2); border:1.5px solid var(--bd); border-radius:16px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px; border-bottom:1px solid var(--bd); padding-bottom:10px;">
                        <div>
                            <h3 style="font-size:18px; font-weight:900; color:var(--tx); margin:0 0 4px;">${p.title}</h3>
                            <span style="color:var(--tx); font-weight:700; font-size:13px;">الشهر: ${p.monthYear} | المستهدف: ${p.targetName}</span>
                        </div>
                        <span class="badge" style="background:#10b981; color:#fff; font-size:13px; font-weight:800; padding:6px 16px;">إنجاز ${progress}%</span>
                    </div>

                    <!-- Progress Bar -->
                    <div style="background:var(--bg); border:1.5px solid var(--bd); height:14px; border-radius:10px; overflow:hidden; margin-bottom:15px;">
                        <div style="background:linear-gradient(90deg, #10b981, #34d399); height:100%; width:${progress}%; transition:width 0.4s;"></div>
                    </div>

                    <div style="background:var(--bg); padding:14px; border-radius:12px; border:1.5px solid var(--bd); margin-bottom:15px;">
                        <strong style="color:#10b981; display:block; margin-bottom:6px; font-size:14px; font-weight:800;">📌 الأهداف المطلوب تحقيقها:</strong>
                        <div style="font-size:13px; color:var(--tx); font-weight:600; white-space:pre-line; line-height:1.6;">${p.objectives}</div>
                    </div>

                    <!-- Interactive Checklist -->
                    <div style="background:var(--bg); padding:16px; border-radius:14px; border:1.5px solid var(--bd); margin-bottom:15px;">
                        <strong style="color:var(--tx); font-size:14px; font-weight:800; display:block; margin-bottom:12px;">✅ قائمة المهام والبنود التنفيذية (انقر لتحديث الإنجاز):</strong>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${tasks.map(function(t, idx) {
                                return `
                                    <label style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:var(--bg2); border:1.5px solid var(--bd); border-radius:10px; cursor:pointer; font-size:14px; color:var(--tx);">
                                        <div style="display:flex; align-items:center; gap:12px;">
                                            <input type="checkbox" ${t.done ? 'checked' : ''} onchange="tgTogglePlanTask('${p.id}', ${idx}, this.checked)" style="width:20px; height:20px; accent-color:#10b981; cursor:pointer;">
                                            <span style="${t.done ? 'text-decoration:line-through; color:var(--tx2); font-weight:600;' : 'font-weight:800;'}">${t.title}</span>
                                        </div>
                                        <div style="display:flex; gap:8px; align-items:center;">
                                            ${t.kpi ? `<span style="font-size:11px; background:rgba(16,185,129,0.15); color:#10b981; padding:3px 8px; border-radius:6px; font-weight:800;">KPI: ${t.kpi}</span>` : ''}
                                            <span style="font-size:11px; background:rgba(59,130,246,0.15); color:#60a5fa; padding:3px 8px; border-radius:6px; font-weight:800;">${t.week || 'أسبوع'}</span>
                                        </div>
                                    </label>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div style="display:flex; justify-content:flex-end;">
                        <button type="button" onclick="tgPrintMonthlyPlan('${p.id}')" class="bt bt-o" style="font-size:13px; padding:8px 16px; font-weight:800;">🖨 طباعة الخطة MP</button>
                        <button type="button" onclick="tgDeleteMonthlyPlan('${p.id}')" class="bt bt-o" style="border-color:#ef4444; color:#ef4444; font-size:13px; padding:8px 16px; font-weight:800;">🗑 حذف الخطة</button>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    });
};

window.tgTogglePlanTask = function(planId, taskIdx, isDone) {
    if (!window.db || !planId) return;

    db.collection('monthly_plans').doc(planId).get().then(function(doc) {
        if (!doc.exists) return;
        var data = doc.data();
        var tasks = data.tasks || [];
        if (tasks[taskIdx]) {
            tasks[taskIdx].done = isDone;
        }

        var completedCount = tasks.filter(function(t){ return t.done; }).length;
        var progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

        db.collection('monthly_plans').doc(planId).update({
            tasks: tasks,
            progress: progress
        }).then(function() {
            if (typeof tgShowToast === 'function') tgShowToast('✅ تم تحديث حالة نسبة إنجاز الخطة إلى ' + progress + '%');
            if (typeof loadMonthlyPlansEmp === 'function') loadMonthlyPlansEmp();
            if (typeof tgRenderMonthlyPlansAdmin === 'function') tgRenderMonthlyPlansAdmin();
        });
    });
};



// ─── FULLY CUSTOMIZED WEEKLY REPORTS (WR) ENGINE ────────────────────────────

window._wrActiveSections = [];
window._wrEditingReportId = null;

// Helper to get Thursday Date of any ISO Week (e.g. 2026-W31 -> July 30, 2026)
window.tgGetIsoWeekDate = function(year, weekNum) {
    var jan4 = new Date(year, 0, 4);
    var dayOfWeek = jan4.getDay(); // 0 = Sun, 1 = Mon ... 4 = Thu
    var thursdayW1 = new Date(jan4);
    thursdayW1.setDate(jan4.getDate() + (4 - (dayOfWeek === 0 ? 7 : dayOfWeek)));
    var targetThursday = new Date(thursdayW1);
    targetThursday.setDate(thursdayW1.getDate() + (weekNum - 1) * 7);
    return targetThursday;
};

window.tgFormatWeekName = function(weekStr) {
    if (!weekStr) return '';
    try {
        var str = String(weekStr).trim();
        var parts = str.split('-W');
        if (parts.length === 2) {
            var year = parseInt(parts[0], 10);
            var weekNum = parseInt(parts[1], 10);
            
            var monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
            var ordinalWeeksAr = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];

            var d = window.tgGetIsoWeekDate(year, weekNum);
            var monthIdx = d.getMonth();
            var dayOfMonth = d.getDate();
            
            var weekInMonthIdx = Math.min(3, Math.floor((dayOfMonth - 1) / 7));
            var ordStr = ordinalWeeksAr[weekInMonthIdx] || 'الرابع';
            var mAr = monthNamesAr[monthIdx] || '';
            
            return 'الأسبوع ' + ordStr + ' من شهر ' + mAr + ' ' + year;
        }
    } catch(e){}
    return weekStr;
};

window.tgExtractMonthFromWeeklyReport = function(r) {
    if (!r) return '';
    if (r.weekYear) {
        var parts = String(r.weekYear).split('-W');
        if (parts.length === 2) {
            var year = parseInt(parts[0], 10);
            var weekNum = parseInt(parts[1], 10);
            var d = window.tgGetIsoWeekDate(year, weekNum);
            var y = d.getFullYear();
            var m = String(d.getMonth() + 1).padStart(2, '0');
            return y + '-' + m;
        }
    }
    if (r.weekStart) {
        var dateParts = String(r.weekStart).split('-');
        if (dateParts.length >= 2) {
            return dateParts[0] + '-' + dateParts[1].padStart(2, '0');
        }
    }
    if (r.createdAt) {
        var dateObj = r.createdAt.seconds ? new Date(r.createdAt.seconds * 1000) : new Date(r.createdAt);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0');
        }
    }
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
};


window.tgGetCurrentWeekString = function() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var week1 = new Date(d.getFullYear(), 0, 4);
    var weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return d.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
};

window.tgGenerateWeekOptionsHTML = function(selectedWeekStr) {
    var realCurrentWeekStr = window.tgGetCurrentWeekString();
    var currentWeekStr = selectedWeekStr || realCurrentWeekStr;
    var d = new Date();
    var year = d.getFullYear();
    var html = '';
    
    // Generate weeks from current week down and up for full flexibility
    for (var w = 52; w >= 1; w--) {
        var wStr = String(w).padStart(2, '0');
        var val = year + '-W' + wStr;
        
        var formattedLabel = window.tgFormatWeekName(val);
        var isSel = (val === currentWeekStr) ? 'selected' : '';
        var isCurrentTag = (val === realCurrentWeekStr) ? ' ⭐ (الأسبوع الحالي)' : '';
        html += '<option value="' + val + '" ' + isSel + ' style="background:#0f172a; color:#ffffff; font-weight:bold;">🗓️ ' + formattedLabel + isCurrentTag + '</option>';
    }
    return html;
};

window.tgOpenNewWeeklyReportModal = function() {
    window._wrEditingReportId = null;
    var currentWeekStr = window.tgGetCurrentWeekString();
    var u = window.TG_USER || {};
    var myRole = u.jobTitle || u.role || 'عضو في الفريق';

    var html = `
        <div id="wrModalOverlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.85); z-index:999999; display:flex; align-items:center; justify-content:center; padding:15px; backdrop-filter:blur(10px);">
            <div style="background:#1e293b; border:1.5px solid #334155; width:100%; max-width:820px; max-height:92vh; overflow-y:auto; border-radius:24px; padding:25px; box-shadow:0 25px 60px rgba(0,0,0,0.7); color:#ffffff; font-family:inherit;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1.5px solid #334155; padding-bottom:14px;">
                    <div>
                        <h3 style="margin:0; font-size:20px; font-weight:900; color:#38bdf8; display:flex; align-items:center; gap:8px;">📊 تقديم تقرير أسبوعي مخصص (Customized WR)</h3>
                        <p style="margin:4px 0 0; font-size:12px; color:#94a3b8; font-weight:600;">قم بتحديد وتخصيص بنود ومؤشرات إنجازاتك خلال الأسبوع الحالي.</p>
                    </div>
                    <button type="button" onclick="document.getElementById('wrModalOverlay').remove()" style="background:#334155; border:none; color:#f8fafc; font-size:16px; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:900;">✕</button>
                </div>

                <form onsubmit="tgSubmitWeeklyReport(event)">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:18px;">
                        <div>
                            <label style="font-size:13px; font-weight:800; color:#93c5fd; display:block; margin-bottom:6px;">تحديد الأسبوع *</label>
                            <select id="wrFormWeek" required style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-weight:700; outline:none; cursor:pointer;">
                                ${tgGenerateWeekOptionsHTML(currentWeekStr)}
                            </select>
                        </div>
                        <div>
                            <label style="font-size:13px; font-weight:800; color:#93c5fd; display:block; margin-bottom:6px;">القسم / التخصص / المسمى الوظيفي *</label>
                            <input type="text" id="wrFormDept" value="${myRole}" required style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-weight:700; outline:none;">
                        </div>
                    </div>

                    

                    <!-- Dynamic Custom Sections Container -->
                    <div id="wrCustomSectionsContainer" style="display:flex; flex-direction:column; gap:16px; margin-bottom:20px;"></div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; background:#0f172a; padding:12px 16px; border-radius:14px; border:1px solid #334155;">
                        <button type="button" onclick="tgAddWRCustomSection('تصنيف أسبوعي مخصص')" style="background:#334155; color:#38bdf8; border:1.5px dashed #38bdf8; padding:9px 18px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            ➕ إضافة موضوع جديد
                        </button>
                        <span style="font-size:12px; color:#94a3b8; font-weight:600;">💡 أضف نقاط إنجازات الأسبوع والنتائج المحققة</span>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:12px;">
                        <button type="button" onclick="document.getElementById('wrModalOverlay').remove()" style="background:#334155; color:#cbd5e1; border:1px solid #475569; padding:11px 24px; border-radius:10px; font-weight:800; cursor:pointer;">إلغاء</button>
                        <button type="submit" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#ffffff; border:none; padding:11px 28px; border-radius:10px; font-weight:900; cursor:pointer; box-shadow:0 4px 15px rgba(2,132,199,0.4);">إرسال التقرير الأسبوعي للإدارة</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    window._wrActiveSections = [
        { title: '', items: [{ text: '', metric: '' }] }
    ];
    tgRenderWRSectionsInModal();
};

window.tgOpenEditWeeklyReportModal = function(reportId) {
    if (!reportId) return;

    var openModalWithData = function(r) {
        window._wrEditingReportId = reportId;
        var u = window.TG_USER || {};
        var myRole = r.userRole || r.department || u.jobTitle || u.role || 'عضو في الفريق';

        var html = `
            <div id="wrModalOverlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.85); z-index:999999; display:flex; align-items:center; justify-content:center; padding:15px; backdrop-filter:blur(10px);">
                <div style="background:#1e293b; border:1.5px solid #334155; width:100%; max-width:820px; max-height:92vh; overflow-y:auto; border-radius:24px; padding:25px; box-shadow:0 25px 60px rgba(0,0,0,0.7); color:#ffffff; font-family:inherit;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1.5px solid #334155; padding-bottom:14px;">
                        <div>
                            <h3 style="margin:0; font-size:20px; font-weight:900; color:#3b82f6; display:flex; align-items:center; gap:8px;">✏️ تعديل التقرير الأسبوعي المخصص (WR)</h3>
                            <p style="margin:4px 0 0; font-size:12px; color:#94a3b8; font-weight:600;">قم بتحديث وتعديل بنود التقرير الأسبوعي وإعادة إرساله للإدارة.</p>
                        </div>
                        <button type="button" onclick="document.getElementById('wrModalOverlay').remove()" style="background:#334155; border:none; color:#f8fafc; font-size:16px; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:900;">✕</button>
                    </div>

                    ${r.adminNotes ? `
                        <div style="background:rgba(239,68,68,0.15); border:1.5px solid #ef4444; padding:12px 16px; border-radius:12px; font-size:13px; color:#fca5a5; margin-bottom:20px; font-weight:bold;">
                            ⚠️ توجيه الإدارة للتعديل: ${r.adminNotes}
                        </div>
                    ` : ''}

                    <form onsubmit="tgSubmitWeeklyReport(event)">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:18px;">
                            <div>
                                <label style="font-size:13px; font-weight:800; color:#93c5fd; display:block; margin-bottom:6px;">تحديد الأسبوع *</label>
                                <select id="wrFormWeek" required style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-weight:700; outline:none; cursor:pointer;">
                                ${tgGenerateWeekOptionsHTML(r.weekYear || '')}
                            </select>
                            </div>
                            <div>
                                <label style="font-size:13px; font-weight:800; color:#93c5fd; display:block; margin-bottom:6px;">القسم / التخصص / المسمى الوظيفي *</label>
                                <input type="text" id="wrFormDept" value="${myRole}" required style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-weight:700; outline:none;">
                            </div>
                        </div>

                        <!-- Dynamic Custom Sections Container -->
                        <div id="wrCustomSectionsContainer" style="display:flex; flex-direction:column; gap:16px; margin-bottom:20px;"></div>

                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:22px; background:#0f172a; padding:12px 16px; border-radius:14px; border:1px solid #334155;">
                            <button type="button" onclick="tgAddWRCustomSection('تصنيف مخصص جديد')" style="background:#334155; color:#38bdf8; border:1.5px dashed #38bdf8; padding:9px 18px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                ➕ إضافة موضوع جديد
                            </button>
                            <span style="font-size:12px; color:#94a3b8; font-weight:600;">💡 تعديل الحقول والبنود</span>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:12px;">
                            <button type="button" onclick="document.getElementById('wrModalOverlay').remove()" style="background:#334155; color:#cbd5e1; border:1px solid #475569; padding:11px 24px; border-radius:10px; font-weight:800; cursor:pointer;">إلغاء</button>
                            <button type="submit" style="background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#ffffff; border:none; padding:11px 28px; border-radius:10px; font-weight:900; cursor:pointer; box-shadow:0 4px 15px rgba(59,130,246,0.4);">💾 حفظ التعديلات وإعادة الإرسال للإدارة</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);

        var sections = r.customSections || [];
        if (sections.length === 0) {
            sections = [
                { title: '🎯 أهم إنجازات الأسبوع', items: [{ text: r.content || r.achievements || '', metric: '' }] },
                { title: '⚠️ المعوقات والتحديات', items: [{ text: r.challenges || 'لا يوجد', metric: '' }] }
            ];
        }
        window._wrActiveSections = JSON.parse(JSON.stringify(sections));
        tgRenderWRSectionsInModal();
    };

    var foundInMem = (window._allWeeklyReports || []).find(function(item){ return item.id === reportId; });
    if (foundInMem) {
        openModalWithData(foundInMem);
    } else if (window.db) {
        db.collection('weekly_reports').doc(reportId).get().then(function(doc) {
            if (doc.exists) openModalWithData(doc.data());
            else alert("التقرير غير موجود!");
        });
    }
};

window.tgApplyWRTemplate = function(type) {
    window._wrActiveSections = [
        { title: '', items: [{ text: '', metric: '' }] }
    ];
    tgRenderWRSectionsInModal();
};

window.tgRenderWRSectionsInModal = function() {
    var container = document.getElementById('wrCustomSectionsContainer');
    if (!container) return;

    var html = '';
    window._wrActiveSections.forEach(function(sec, sIdx) {
        var topicNum = sIdx + 1;
        html += `
            <div class="wr-section-card" style="background:#0f172a; border:1.5px solid #334155; border-radius:16px; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:10px; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:8px; flex:1;">
                        <span style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:4px 12px; border-radius:20px; font-weight:900; font-size:13px; white-space:nowrap;">
                            📌 الموضوع ${topicNum}:
                        </span>
                        <input type="text" value="${sec.title || ''}" onchange="window._wrActiveSections[${sIdx}].title = this.value" placeholder="أدخل عنوان الموضوع..." style="font-size:15px; font-weight:900; color:#38bdf8; background:transparent; border:none; border-bottom:1.5px dashed #3b82f6; width:100%; padding:4px 0; outline:none;">
                    </div>
                    ${window._wrActiveSections.length > 1 ? `
                        <button type="button" onclick="tgRemoveWRSection(${sIdx})" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#ef4444; border-radius:8px; padding:4px 10px; font-size:12px; font-weight:800; cursor:pointer;">🗑 حذف الموضوع</button>
                    ` : ''}
                </div>

                <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px;">
                    ${(sec.items || []).map(function(item, iIdx) {
                        return `
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span style="color:#38bdf8; font-weight:900;">•</span>
                                <input type="text" value="${item.text || ''}" onchange="window._wrActiveSections[${sIdx}].items[${iIdx}].text = this.value" placeholder="اكتب النقطة / بند الإنجاز هنا..." required style="flex:2; padding:10px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#ffffff; font-size:13px; font-weight:600; outline:none;">
                                <input type="text" value="${item.metric || ''}" onchange="window._wrActiveSections[${sIdx}].items[${iIdx}].metric = this.value" placeholder="النتيجة/القيمة (اختياري)..." style="width:140px; padding:10px; border-radius:8px; border:1px solid #334155; background:#1e293b; color:#38bdf8; font-size:13px; font-weight:700; outline:none;">
                                ${(sec.items && sec.items.length > 1) ? `
                                    <button type="button" onclick="tgRemoveWRItem(${sIdx}, ${iIdx})" style="background:none; border:none; color:#ef4444; font-size:16px; cursor:pointer; font-weight:bold;">✕</button>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                <button type="button" onclick="tgAddWRItemToSection(${sIdx})" style="background:#1e293b; color:#38bdf8; border:1px solid #38bdf8; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
                    ➕ إضافة نقطة بهذا الموضوع
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
};

window.tgAddWRCustomSection = function(defaultTitle) {
    window._wrActiveSections.push({
        title: defaultTitle || '',
        items: [{ text: '', metric: '' }]
    });
    tgRenderWRSectionsInModal();
};

window.tgRemoveWRSection = function(sIdx) {
    window._wrActiveSections.splice(sIdx, 1);
    tgRenderWRSectionsInModal();
};

window.tgAddWRItemToSection = function(sIdx) {
    if (window._wrActiveSections[sIdx]) {
        window._wrActiveSections[sIdx].items.push({ text: '', metric: '' });
        tgRenderWRSectionsInModal();
    }
};

window.tgRemoveWRItem = function(sIdx, iIdx) {
    if (window._wrActiveSections[sIdx] && window._wrActiveSections[sIdx].items) {
        window._wrActiveSections[sIdx].items.splice(iIdx, 1);
        tgRenderWRSectionsInModal();
    }
};

window.tgSubmitWeeklyReport = function(e) {
    e.preventDefault();
    if (!window.db) return;

    var u = window.TG_USER || {};
    var myUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : '');
    var myName = u.name || u.displayName || 'موظف';

    var weekYear = document.getElementById('wrFormWeek').value;
    var department = document.getElementById('wrFormDept').value;

    var customSections = [];
    window._wrActiveSections.forEach(function(sec) {
        var cleanItems = (sec.items || []).filter(function(it) { return it.text && it.text.trim().length > 0; });
        if (cleanItems.length > 0) {
            customSections.push({
                title: sec.title || 'تصنيف أسبوعي',
                items: cleanItems
            });
        }
    });

    if (customSections.length === 0) {
        alert("يرجى إدخال بند واحد على الأقل في التقرير الأسبوعي!");
        return;
    }

    var summaryText = customSections.map(function(sec) {
        return sec.title + ':\n' + sec.items.map(function(it){ return '• ' + it.text + (it.metric ? ' ['+it.metric+']' : ''); }).join('\n');
    }).join('\n\n');

    var reportData = {
        uid: myUid,
        userName: myName,
        userRole: department,
        department: department,
        weekYear: weekYear,
        customSections: customSections,
        content: summaryText,
        status: 'pending',
        adminNotes: ''
    };

    var promise;
    if (window._wrEditingReportId) {
        promise = db.collection('weekly_reports').doc(window._wrEditingReportId).update(reportData);
    } else {
        reportData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        promise = db.collection('weekly_reports').add(reportData);
    }

    promise.then(function() {
        if (document.getElementById('wrModalOverlay')) document.getElementById('wrModalOverlay').remove();
        if (typeof tgShowToast === 'function') {
            tgShowToast('✅ تم رفع التقرير الأسبوعي المخصص بنجاح!');
        } else {
            alert('✅ تم رفع التقرير الأسبوعي المخصص بنجاح!');
        }
        var _u = window.TG_USER || {};
        if (typeof tgNotifyAdminsReportSubmitted === 'function') {
            tgNotifyAdminsReportSubmitted('📊 تقرير أسبوعي جديد (WR)', _u.name || _u.displayName || 'موظف', 'تقريره الأسبوعي عالي الكفاءة', 'weekly-report-new');
        }

        if (typeof loadWeeklyReportsEmp === 'function') loadWeeklyReportsEmp();
        if (typeof tgRenderWeeklyReportsAdmin === 'function') tgRenderWeeklyReportsAdmin();
    }).catch(function(err) {
        alert("حدث خطأ أثناء حفظ التقرير الأسبوعي: " + err.message);
    });
};

window.tgApproveWeeklyReport = function(reportId) {
    if (!window.db || !reportId) return;
    db.collection('weekly_reports').doc(reportId).update({
        status: 'approved',
        adminNotes: 'تم الاعتماد رسمياً من الإدارة.'
    }).then(function() {
        if (typeof tgShowToast === 'function') tgShowToast('✅ تم اعتماد التقرير الأسبوعي!');
        if (typeof tgRenderWeeklyReportsAdmin === 'function') tgRenderWeeklyReportsAdmin();
    });
};

window.tgRejectWeeklyReportModal = function(reportId) {
    var note = prompt("ادخل ملاحظات التعديل للموظف:");
    if (note === null) return;
    db.collection('weekly_reports').doc(reportId).update({
        status: 'rejected',
        adminNotes: note
    }).then(function() {
        if (typeof tgShowToast === 'function') tgShowToast('إعادة التقرير الأسبوعي للموظف للتعديل.');
        if (typeof tgRenderWeeklyReportsAdmin === 'function') tgRenderWeeklyReportsAdmin();
    });
};

window.tgDeleteWeeklyReport = function(reportId) {
    if (!reportId) return;
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا التقرير الأسبوعي نهائياً؟")) return;

    if (window._allWeeklyReports) {
        window._allWeeklyReports = window._allWeeklyReports.filter(function(r){ return r.id !== reportId; });
    }

    var p1 = db.collection('weekly_reports').doc(reportId).delete().catch(function(){});
    var p2 = db.collection('weeklyReports').doc(reportId).delete().catch(function(){});

    Promise.all([p1, p2]).then(function() {
        if (typeof tgShowToast === 'function') tgShowToast('🗑 تم حذف التقرير الأسبوعي بنجاح!');
        else alert('🗑 تم حذف التقرير الأسبوعي بنجاح!');

        if (typeof tgRenderWeeklyReportsAdmin === 'function') tgRenderWeeklyReportsAdmin();
        if (typeof loadWeeklyReportsEmp === 'function') loadWeeklyReportsEmp();
    }).catch(function(err) {
        alert("حدث خطأ أثناء الحذف: " + (err ? err.message : ''));
    });
};

window.tgPrintWeeklyReport = function(reportId) {
    if (!reportId) return;

    var renderWRPrint = function(r) {
        var customSections = r.customSections || [
            { title: '🎯 الإنجازات الأسبوعية', items: [{ text: r.content || 'لم تذكر', metric: '' }] }
        ];

        var printHTML = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>تقرير أسبوعي مخصص - ${r.userName || ''} (${r.weekYear || ''})</title>
                <style>
                    @page { size: A4; margin: 12mm; }
                    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #ffffff; color: #0f172a; padding: 25px; margin: 0; line-height: 1.6; }
                    .no-print { background: #1e293b; color: #ffffff; padding: 14px 22px; border-radius: 14px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
                    .no-print button { cursor: pointer; padding: 10px 22px; border-radius: 10px; border: none; font-weight: 800; font-size: 14px; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 25px; }
                    .logo-title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
                    .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 600; }
                    .badge { background: #0284c7; color: #ffffff; padding: 8px 18px; border-radius: 20px; font-size: 14px; font-weight: 800; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 25px; }
                    .info-box { background: #f8fafc; border: 1.5px solid #e2e8f0; padding: 14px; border-radius: 12px; font-size: 13px; }
                    .info-box strong { color: #334155; display: block; margin-bottom: 4px; font-size: 12px; }
                    .section-card { margin-bottom: 22px; background: #f8fafc; border: 1.5px solid #e2e8f0; padding: 18px; border-radius: 14px; page-break-inside: avoid; }
                    .sec-title { font-size: 16px; font-weight: 900; color: #0369a1; border-bottom: 1.5px dashed #cbd5e1; padding-bottom: 8px; margin-bottom: 14px; }
                    .bullet-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
                    .bullet-table td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; font-size: 13px; vertical-align: top; }
                    .bullet-table tr:last-child td { border-bottom: none; }
                    .metric-tag { background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 4px 10px; border-radius: 6px; font-size: 12px; white-space: nowrap; }
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; font-size: 13px; font-weight: 800; color: #334155; border-top: 2px dashed #cbd5e1; padding-top: 25px; page-break-inside: avoid; }
                    @media print {
                        .no-print { display: none !important; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print">
                    <span style="font-size:15px; font-weight:800; color:#38bdf8;">🖨 معاينة التقرير الأسبوعي المخصص قبل الطباعة</span>
                    <div style="display:flex; gap:12px;">
                        <button onclick="window.print()" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; box-shadow:0 4px 15px rgba(2,132,199,0.4);">🖨 طباعة المستند الآن</button>
                        <button onclick="if(window.opener){window.close();}else{var el=document.getElementById('tgInPagePrintOverlay'); if(el) el.remove();}" style="background:#475569; color:#fff;">✕ إغلاق النافذة</button>
                    </div>
                </div>

                <div class="header">
                    <div>
                        <div class="logo-title">Tech Go — التقرير الأسبوعي المخصص (WR)</div>
                        <div class="subtitle">سجل متابعة الأداء ومستهدفات العمل الأسبوعية</div>
                    </div>
                    <div>
                        <div class="badge">${tgFormatWeekName(r.weekYear)}</div>
                    </div>
                </div>

                <div class="grid">
                    <div class="info-box">
                        <strong>اسم الموظف:</strong>
                        <span style="font-size:15px; font-weight:900; color:#0f172a;">${r.userName || ''}</span>
                    </div>
                    <div class="info-box">
                        <strong>القسم / التخصص:</strong>
                        <span style="font-size:15px; font-weight:800; color:#0f172a;">${r.userRole || r.department || ''}</span>
                    </div>
                    <div class="info-box">
                        <strong>حالة التقرير:</strong>
                        <span style="font-size:14px; font-weight:800; color:${r.status === 'approved' ? '#10b981' : '#f59e0b'};">
                            ${r.status === 'approved' ? '✅ معتمد رسمياً' : '🕒 قيد المراجعة'}
                        </span>
                    </div>
                </div>

                ${customSections.map(function(sec) {
                    return `
                        <div class="section-card">
                            <div class="sec-title">${sec.title}</div>
                            <table class="bullet-table">
                                <tbody>
                                    ${(sec.items || []).map(function(it) {
                                        return `
                                            <tr>
                                                <td style="width:20px; color:#0284c7; font-weight:900;">•</td>
                                                <td style="font-weight:600; color:#1e293b;">${it.text}</td>
                                                ${it.metric ? `<td style="width:130px; text-align:left;"><span class="metric-tag">${it.metric}</span></td>` : ''}
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }).join('')}

                ${r.adminNotes ? `
                    <div class="section-card" style="background:#f0fdf4; border-color:#bbf7d0;">
                        <div class="sec-title" style="color:#166534;">💬 توجيهات واعتماد الإدارة:</div>
                        <div style="font-weight:700; color:#14532d;">${r.adminNotes}</div>
                    </div>
                ` : ''}

                <div class="footer">
                    <div>توقيع الموظف:<br><br>____________________</div>
                    <div>مراجعة مدير المتابعة:<br><br>____________________</div>
                    <div>اعتماد المدير التنفيذي:<br><br>____________________</div>
                </div>

                <script>
                    setTimeout(function() { window.focus(); window.print(); }, 400);
                </script>
            </body>
            </html>
        `;

        var printWin = null;
        try { printWin = window.open('', '_blank', 'width=950,height=850'); } catch(e){}

        if (printWin && printWin.document) {
            printWin.document.open();
            printWin.document.write(printHTML);
            printWin.document.close();
        } else {
            if (document.getElementById('tgInPagePrintOverlay')) {
                document.getElementById('tgInPagePrintOverlay').remove();
            }
            var fullModal = document.createElement('div');
            fullModal.id = 'tgInPagePrintOverlay';
            fullModal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.95); z-index:9999999; display:flex; flex-direction:column; padding:20px; overflow-y:auto; backdrop-filter:blur(10px); font-family:sans-serif;';
            fullModal.innerHTML = `
                <style>
                    @media print {
                        body > *:not(#tgInPagePrintOverlay) { display: none !important; }
                        #tgInPagePrintOverlay { position: absolute !important; top:0 !important; left:0 !important; right:0 !important; bottom:auto !important; background:#ffffff !important; padding:0 !important; }
                        .no-print { display: none !important; }
                    }
                </style>
                <div style="background:#ffffff; border-radius:18px; max-width:900px; width:100%; margin:0 auto; padding:10px; box-shadow:0 25px 60px rgba(0,0,0,0.5);">
                    ${printHTML}
                </div>
            `;
            document.body.appendChild(fullModal);
        }
    };

    var foundInMem = (window._allWeeklyReports || []).find(function(item){ return item.id === reportId; });
    if (foundInMem) {
        renderWRPrint(foundInMem);
    } else if (window.db) {
        db.collection('weekly_reports').doc(reportId).get().then(function(doc) {
            if (doc.exists) renderWRPrint(doc.data());
            else alert("التقرير غير موجود!");
        });
    }
};



// Employee View for Unified Reports (Weekly & Monthly)
window.loadWeeklyReportsEmp = function(container) {
    if (!container) container = document.getElementById('epg-wkr') || document.getElementById('epg-weeklyreports');
    if (!container) return;

    var isThursday = (new Date().getDay() === 4);
    var thursdayNotice = isThursday ? `
        <div style="background:linear-gradient(135deg, #78350f, #451a03); border:2px solid #f59e0b; border-radius:16px; padding:18px 22px; margin-bottom:22px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; box-shadow:0 10px 30px rgba(120,53,15,0.4); color:#ffffff;">
            <div>
                <div style="font-size:16.5px; font-weight:900; color:#fef08a; display:flex; align-items:center; gap:8px; text-shadow:0 1px 3px rgba(0,0,0,0.6);">
                    🚨 تذكير يوم الخميس الموحد بالتقرير الأسبوعي
                </div>
                <p style="margin:6px 0 0; font-size:13.5px; color:#fef3c7; font-weight:700; line-height:1.5; text-shadow:0 1px 2px rgba(0,0,0,0.5);">
                    تنبيه هام: اليوم الخميس وهو الموعد الرسمي الموحد لإرسال التقرير الأسبوعي (WR). يرجى إرساله قبل نهاية اليوم لتوثيق أداء الأسبوع.
                </p>
            </div>
            <button type="button" onclick="tgOpenNewWeeklyReportModal()" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#ffffff; font-weight:900; font-size:14px; padding:11px 24px; border-radius:30px; border:none; cursor:pointer; box-shadow:0 4px 15px rgba(245,158,11,0.5); text-shadow:0 1px 2px rgba(0,0,0,0.3);">
                ⚡ تقديم التقرير الأسبوعي الآن
            </button>
        </div>
    ` : '';

    container.innerHTML = `
        <div class="set-sec">
            ${thursdayNotice}
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px; margin-bottom:24px; border-bottom:1.5px solid var(--bd); padding-bottom:18px;">
                <div>
                    <h2 style="font-size:22px; font-weight:900; color:var(--tx); margin:0 0 6px;">📊 التقارير (أسبوعية وشهرية مدمجة)</h2>
                    <p style="color:var(--tx2); font-size:13.5px; margin:0; font-weight:600;">تقديم التقارير الأسبوعية مع إمكانية التوليد الآلي للتقرير الشهري بضغطة زر واحدة.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button type="button" onclick="tgGenerateMonthlyFromWeekly()" class="bt" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; font-weight:900; font-size:13.5px; padding:10px 20px; border-radius:30px; box-shadow:0 4px 15px rgba(16,185,129,0.35); border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <span>⚡</span> توليد التقرير الشهري تلقائياً
                    </button>
                    <button type="button" onclick="tgOpenNewWeeklyReportModal()" class="bt" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; font-weight:900; font-size:13.5px; padding:10px 20px; border-radius:30px; box-shadow:0 4px 15px rgba(2,132,199,0.35); border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <span>➕</span> تقديم تقرير أسبوعي جديد
                    </button>
                </div>
            </div>

            <!-- 📄 قسم التقرير الشهري التلقائي المـُرسل للإدارة (MR) -->
            <div style="margin-bottom:32px;">
                <h3 style="font-size:17.5px; font-weight:900; color:#10b981; margin:0 0 14px; display:flex; align-items:center; gap:8px;">
                    <span>📄</span> التقرير الشهري التلقائي (MR) — المـُرسل للإدارة
                </h3>
                <div id="mrEmpListInUnified">
                    <div style="text-align:center; padding:15px; color:var(--tx2); font-weight:bold;">⏳ جاري تحميل التقرير الشهري...</div>
                </div>
            </div>

            <!-- 📊 قسم التقارير الأسبوعية (WR) -->
            <div>
                <h3 style="font-size:17.5px; font-weight:900; color:#0284c7; margin:0 0 14px; display:flex; align-items:center; gap:8px;">
                    <span>🗓️</span> سجل التقارير الأسبوعية (WR)
                </h3>
                <div id="wrEmpList">
                    <div style="text-align:center; padding:20px; color:var(--tx2); font-weight:bold;">⏳ جاري تحميل التقارير الأسبوعية...</div>
                </div>
            </div>
        </div>
    `;

    if (typeof tgRenderMonthlyReportsEmp === 'function') tgRenderMonthlyReportsEmp();
    if (typeof tgRenderWeeklyReportsEmp === 'function') tgRenderWeeklyReportsEmp();
};

window.tgRenderWeeklyReportsEmp = function(retryCount) {
    retryCount = retryCount || 0;
    var listEl = document.getElementById('wrEmpList');
    if (!listEl) return;

    var renderEmpty = function() {
        if (listEl && listEl.innerHTML.indexOf('جاري تحميل') !== -1) {
            listEl.innerHTML = `
                <div style="background:var(--bg2); border:1.5px dashed var(--bd); padding:40px; text-align:center; border-radius:14px; color:var(--tx); font-weight:800;">
                    📝 لم تقم بتقديم أي تقارير أسبوعية بعد. انقر على "تقديم تقرير أسبوعي مخصص جديد" لإنشاء أول تقرير!
                </div>
            `;
        }
    };

    var timer = setTimeout(renderEmpty, 1500);

    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) {
        if (retryCount < 10) setTimeout(function(){ tgRenderWeeklyReportsEmp(retryCount + 1); }, 300);
        else renderEmpty();
        return;
    }

    var u = window.TG_USER || {};
    var myUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : '');

    db.collection('weekly_reports').get().then(function(snap) {
        clearTimeout(timer);
        var reports = [];
        snap.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            if (myUid && data.uid === myUid) reports.push(data);
        });

        reports.sort(function(a, b) {
            var tA = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
            var tB = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
            return tB - tA;
        });

        window._allWeeklyReports = reports;

        if (reports.length === 0) {
            renderEmpty();
            return;
        }

        var html = '';
        reports.forEach(function(r) {
            var statusBadge = '';
            if (r.status === 'approved') statusBadge = '<span class="badge" style="background:rgba(16,185,129,0.2); color:#34d399; border:1.5px solid #10b981; font-weight:800; padding:4px 14px; border-radius:20px;">✅ معتمد</span>';
            else if (r.status === 'rejected') statusBadge = '<span class="badge" style="background:rgba(239,68,68,0.2); color:#f87171; border:1.5px solid #ef4444; font-weight:800; padding:4px 14px; border-radius:20px;">❌ يحتاج تعديل</span>';
            else statusBadge = '<span class="badge" style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1.5px solid #f59e0b; font-weight:800; padding:4px 14px; border-radius:20px;">🕒 قيد المراجعة</span>';

            html += `
                <div class="card p-3 mb-3" style="background:var(--bg2); border:1.5px solid var(--bd); border-radius:16px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid var(--bd); padding-bottom:8px;">
                        <h4 style="margin:0; font-size:16px; font-weight:900; color:var(--tx);">تقرير: ${tgFormatWeekName(r.weekYear)}</h4>
                        <div>${statusBadge}</div>
                    </div>
                    <p style="font-size:13px; color:var(--tx); margin:0 0 10px; font-weight:600;">${(r.content || '').slice(0, 180)}...</p>

                    ${r.adminNotes ? `
                        <div style="background:rgba(239,68,68,0.12); border:1.5px solid rgba(239,68,68,0.3); padding:10px 14px; border-radius:10px; font-size:13px; color:#ef4444; margin-bottom:10px; font-weight:bold;">
                            <strong>توجيه الإدارة:</strong> ${r.adminNotes}
                        </div>
                    ` : ''}

                    <div style="display:flex; justify-content:flex-end; gap:10px; align-items:center;">
                        ${r.status !== 'approved' ? `
                            <button type="button" onclick="tgOpenEditWeeklyReportModal('${r.id}')" class="bt" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; font-size:13px; padding:6px 16px; font-weight:900; border-radius:8px;">✏️ تعديل التقرير</button>
                        ` : ''}
                        <button type="button" onclick="tgPrintWeeklyReport('${r.id}')" class="bt bt-o" style="font-size:13px; padding:6px 14px; font-weight:800;">🖨 طباعة التقرير WR</button>
                        <button type="button" onclick="tgDeleteWeeklyReport('${r.id}')" class="bt bt-o" style="border-color:#ef4444; color:#ef4444; font-size:13px; padding:6px 14px; font-weight:800;">🗑 حذف التقرير</button>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
    }).catch(function(err) {
        console.error("Error loading emp weekly reports:", err);
        clearTimeout(timer);
        renderEmpty();
    });
};


// ─── AUTOMATIC REMINDER SYSTEM (نظام التذكير الأوتوماتيكي للتفقد والتقديم) ─────

window.tgCheckAutomaticReminders = function() {
    if (!window.db || !window.TG_USER) return;
    var u = window.TG_USER;
    // الإدارة والمسؤولين ليسوا موظفين عاديين - لا يتم إظهار تنبيهات التقديم التلقائية لهم
    if (u.role === 'admin' || u.role === 'tech_admin') return;

    var myUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : '');
    if (!myUid) return;

    var now = new Date();
    var currentYearStr = String(now.getFullYear());
    var currentMonthStr = currentYearStr + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var currentWeekStr = window.tgGetCurrentWeekString();
    var dayOfMonth = now.getDate();

    // Check Monthly Report
    db.collection('monthly_reports').where('uid', '==', myUid).get().then(function(mrSnap) {
        var hasMRThisMonth = false;
        mrSnap.forEach(function(doc) {
            if (doc.data().monthYear === currentMonthStr) hasMRThisMonth = true;
        });

        // Check Monthly Plan
        db.collection('monthly_plans').get().then(function(mpSnap) {
            var hasMPThisMonth = false;
            mpSnap.forEach(function(doc) {
                var d = doc.data();
                if ((d.uid === myUid || d.createdBy === myUid) && d.monthYear === currentMonthStr) hasMPThisMonth = true;
            });

            // Check Weekly Report
            db.collection('weekly_reports').where('uid', '==', myUid).get().then(function(wrSnap) {
                var hasWRThisWeek = false;
                wrSnap.forEach(function(doc) {
                    if (doc.data().weekYear === currentWeekStr) hasWRThisWeek = true;
                });

                tgShowReminderBannerIfNeeded(hasWRThisWeek, hasMRThisMonth, hasMPThisMonth, dayOfMonth);
            });
        });
    });
};

window.tgShowReminderBannerIfNeeded = function(hasWRThisWeek, hasMRThisMonth, hasMPThisMonth, dayOfMonth) {
    if (document.getElementById('tgAutoReminderBanner')) {
        document.getElementById('tgAutoReminderBanner').remove();
    }

    var now = new Date();
    var dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday, 5 = Friday, 6 = Saturday

    var reminders = [];

    // التقرير الشهري: في نهاية الشهر (من يوم 24 إلى نهاية الشهر)
    if (!hasMRThisMonth && dayOfMonth >= 24) {
        reminders.push({
            type: 'mr',
            badge: '📄 تذكير نهاية الشهر',
            title: '📄 حان موعد نهاية الشهر! يرجى تقديم التقرير الشهري المخصص (MR).',
            btnText: '⚡ تقديم التقرير الشهري الآن',
            action: 'tgOpenNewMonthlyReportModal()'
        });
    }

    // التقرير الأسبوعي: يوم الخميس أو نهاية الأسبوع (الخميس، الجمعة، السبت، أو عدم تقديم التقرير)
    if (!hasWRThisWeek && (dayOfWeek >= 4 || dayOfWeek === 0)) {
        var isThursday = (dayOfWeek === 4);
        
        // إذا كان اليوم الخميس ولم يُرسل التقرير الأسبوعي بعد، يتم إصدار تنبيه خاص بالخميس
        if (isThursday && window.TG_USER && window.TG_USER.uid) {
            var weekStr = window.tgGetCurrentWeekString();
            var notifKey = 'tg_thursday_notif_sent_' + weekStr + '_' + window.TG_USER.uid;
            if (!localStorage.getItem(notifKey)) {
                localStorage.setItem(notifKey, '1');
                if (typeof tgSendPushToUser === 'function') {
                    tgSendPushToUser(window.TG_USER.uid, '🚨 تذكير يوم الخميس الأسبوعي', 'اليوم الخميس! يرجى إرسال التقرير الأسبوعي الخاص بك قبل نهاية اليوم.', 'weekly-report-reminder');
                }
                if (typeof tgShowToast === 'function') {
                    tgShowToast('🚨 تذكير الخميس: لا تنسَ تقديم تقريرك الأسبوعي اليوم!');
                }
            }
        }

        reminders.push({
            type: 'wr',
            badge: isThursday ? '🚨 تذكير يوم الخميس الموحد' : '📊 تذكير التقرير الأسبوعي',
            title: isThursday 
                ? '🚨 اليوم الخميس! حان موعد تقديم التقرير الأسبوعي المخصص (WR) قبل نهاية اليوم.' 
                : '📊 حان موعد نهاية الأسبوع! يرجى تقديم التقرير الأسبوعي المخصص (WR).',
            btnText: '⚡ تقديم التقرير الأسبوعي الآن',
            action: 'tgOpenNewWeeklyReportModal()'
        });
    }

    // الخطة الشهرية: في بداية الشهر (أول 10 أيام من الشهر)
    if (!hasMPThisMonth && dayOfMonth <= 10) {
        reminders.push({
            type: 'mp',
            badge: '🎯 تذكير بداية الشهر',
            title: '🎯 بداية الشهر الجديد! يرجى إعداد وتأكيد الخطة الشهرية المخصصة (MP).',
            btnText: '⚡ إنشاء الخطة الشهرية الآن',
            action: 'tgOpenNewMonthlyPlanModal()'
        });
    }

    if (reminders.length === 0) return;

    var first = reminders[0];
    var banner = document.createElement('div');
    banner.id = 'tgAutoReminderBanner';
    var borderColor = first.type === 'wr' && dayOfWeek === 4 ? '#f59e0b' : '#38bdf8';
    var shadowGlow = first.type === 'wr' && dayOfWeek === 4 ? '0 15px 40px rgba(245,158,11,0.45)' : '0 15px 40px rgba(0,0,0,0.6)';

    banner.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999; background:linear-gradient(135deg, #1e293b, #0f172a); border:2px solid ' + borderColor + '; border-radius:18px; padding:16px 20px; box-shadow:' + shadowGlow + '; color:#ffffff; max-width:420px; font-family:inherit; animation:slideUp 0.4s ease;';

    banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap:10px;">
            <div style="font-size:14.5px; font-weight:900; color:#fef08a; display:flex; align-items:center; gap:6px;">
                🔔 ${first.badge || 'تذكير تلقائي'}
            </div>
            <button onclick="document.getElementById('tgAutoReminderBanner').remove()" style="background:none; border:none; color:#cbd5e1; font-size:16px; cursor:pointer; font-weight:bold;">✕</button>
        </div>
        <p style="margin:0 0 12px; font-size:13.5px; font-weight:700; color:#f8fafc; line-height:1.5;">${first.title}</p>
        <div style="display:flex; justify-content:flex-end;">
            <button onclick="document.getElementById('tgAutoReminderBanner').remove(); ${first.action};" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#ffffff; border:none; padding:9px 20px; border-radius:10px; font-size:13.5px; font-weight:900; cursor:pointer; box-shadow:0 4px 15px rgba(245,158,11,0.4);">
                ${first.btnText}
            </button>
        </div>
    `;

    document.body.appendChild(banner);
};

window.tgSendAutomaticReportRemindersToAll = function() {
    if (!confirm("هل تريد إرسال إشعارات وتنبيهات أوتوماتيكية لجميع الموظفين المتأخرين؟")) return;
    if (typeof sendWeeklyReportReminder === 'function') sendWeeklyReportReminder();
    if (typeof tgShowToast === 'function') tgShowToast('🔔 تم إرسال التنبيهات والأشعارات الأوتوماتيكية بنجاح!');
    else alert('🔔 تم إرسال التنبيهات والأشعارات الأوتوماتيكية بنجاح!');
};

// Automatically run reminder check after auth initializes and periodically
setTimeout(function() {
    if (typeof tgCheckAutomaticReminders === 'function') tgCheckAutomaticReminders();
}, 2000);

setInterval(function() {
    if (typeof tgCheckAutomaticReminders === 'function') tgCheckAutomaticReminders();
}, 15 * 60 * 1000);



// ─── INCOMING TELEPHONE CALL ENHANCEMENTS ─────────────────────────────────────

// Unlock AudioContext on first user interaction so ringtone plays loudly
window.addEventListener('click', function unlockAudioCtxOnce() {
    if (window._incomingAudioCtx && window._incomingAudioCtx.state === 'suspended') {
        window._incomingAudioCtx.resume();
    }
    window.removeEventListener('click', unlockAudioCtxOnce);
}, { once: true });

// Auto-run meetings listener on startup
(function autoStartMeetingListener() {
    if (typeof initMeetingsListener === 'function') {
        initMeetingsListener();
    } else {
        setTimeout(autoStartMeetingListener, 300);
    }
})();

// Function for testing incoming phone call UI manually
window.tgTestIncomingPhoneCall = function() {
    if (typeof playMeetingRinging === 'function') {
        playMeetingRinging('الإدارة العامة 👨‍💼', 'test-call-123', 'techgo-test-room', 'اجتماع عمل مباشر عاجل 🎥');
    } else {
        alert("تعذر تشغيل تجربة المكالمة - يرجى تسجيل الدخول أولاً.");
    }
};



// ─── MASTER EXECUTIVE MONTHLY REPORT ENGINE (تقرير الإدارة الشهري التجميعي) ────

window.tgGenerateMasterExecutiveReportModal = function() {
    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) {
        if (typeof tgShowToast === 'function') tgShowToast('⚠️ تعذر الاتصال بقاعدة البيانات.');
        else alert('⚠️ تعذر الاتصال بقاعدة البيانات.');
        return;
    }

    var monthVal = document.getElementById('mrFilterMonth') ? document.getElementById('mrFilterMonth').value : '';
    if (!monthVal) {
        var now = new Date();
        monthVal = String(now.getFullYear()) + '-' + String(now.getMonth() + 1).padStart(2, '0');
    }

    var processAndShowModal = function(allReports) {
        window._allMonthlyReports = allReports || [];

        // Filter reports for selected month (excluding master executive reports)
        var reports = window._allMonthlyReports.filter(function(r) {
            return (r.monthYear === monthVal || !r.monthYear) && r.type !== 'executive_master';
        });

        // Fallback: If no reports for this specific month, fallback to all available employee reports
        if (reports.length === 0) {
            reports = window._allMonthlyReports.filter(function(r) {
                return r.type !== 'executive_master';
            });
        }

        if (reports.length === 0) {
            alert("⚠️ لا توجد تقارير شهريّة مقدّمة من الموظفين حتى الآن لإنشاء التقرير التجميعي! اطلب من الموظفين تقديم تقاريرهم الشهرية أولاً.");
            return;
        }

        // Group achievements by department/role
        var deptMap = {};
        reports.forEach(function(r) {
            var deptName = r.userRole || r.department || 'القسم الإداري';
            if (!deptMap[deptName]) deptMap[deptName] = [];

            var customSections = r.customSections || [];
            if (customSections.length > 0) {
                customSections.forEach(function(sec) {
                    (sec.items || []).forEach(function(it) {
                        deptMap[deptName].push({
                            userName: r.userName || 'موظف',
                            secTitle: sec.title || 'بنود الإنجاز',
                            text: it.text || '',
                            metric: it.metric || ''
                        });
                    });
                });
            } else if (r.achievements || r.content) {
                deptMap[deptName].push({
                    userName: r.userName || 'موظف',
                    secTitle: 'الإنجازات والمهام',
                    text: r.achievements || r.content,
                    metric: ''
                });
            }
        });

        var deptNames = Object.keys(deptMap);
        var u = window.TG_USER || {};

        var html = `
            <div id="execMrModalOverlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.88); z-index:999999; display:flex; align-items:center; justify-content:center; padding:15px; backdrop-filter:blur(10px);">
                <div style="background:#1e293b; border:1.5px solid #334155; width:100%; max-width:900px; max-height:92vh; overflow-y:auto; border-radius:24px; padding:28px; box-shadow:0 25px 60px rgba(0,0,0,0.7); color:#ffffff; font-family:inherit;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1.5px solid #334155; padding-bottom:14px;">
                        <div>
                            <h3 style="margin:0; font-size:22px; font-weight:900; color:#f59e0b; display:flex; align-items:center; gap:8px;">✨ التقرير الشهري التجميعي الشامل للإدارة (Executive Master MR)</h3>
                            <p style="margin:4px 0 0; font-size:13px; color:#94a3b8; font-weight:600;">تم تجميع ودراسة إنجازات كافة الأقسام والموظفين لشهر (${monthVal}) لإصدار التقرير التنفيذي الموحد.</p>
                        </div>
                        <button type="button" onclick="document.getElementById('execMrModalOverlay').remove()" style="background:#334155; border:none; color:#f8fafc; font-size:16px; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:900;">✕</button>
                    </div>

                    <form onsubmit="tgSaveMasterExecutiveReport(event, '${monthVal}')">
                        <div style="background:#0f172a; border:1.5px solid #3b82f6; padding:16px; border-radius:14px; margin-bottom:20px;">
                            <h4 style="color:#60a5fa; margin:0 0 10px; font-size:15px; font-weight:900;">📊 ملخص الأقسام المشاركة في التقرير (${reports.length} تقارير موظفين)</h4>
                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
                                ${deptNames.map(function(dName) {
                                    return `
                                        <div style="background:#1e293b; padding:10px 14px; border-radius:10px; border:1px solid #334155;">
                                            <strong style="color:#38bdf8; font-size:13px; display:block;">${dName}</strong>
                                            <span style="font-size:12px; color:#94a3b8;">${deptMap[dName].length} بنود إنجاز موثقة</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Full Aggregated Breakdown Preview -->
                        <div style="background:#0f172a; border:1.5px solid #334155; padding:18px; border-radius:14px; margin-bottom:20px; max-height:260px; overflow-y:auto;">
                            <h4 style="color:#34d399; margin:0 0 12px; font-size:15px; font-weight:900;">📋 تفاصيل إنجازات الأقسام المجمعة:</h4>
                            ${deptNames.map(function(dName) {
                                var items = deptMap[dName];
                                return `
                                    <div style="margin-bottom:14px; border-bottom:1px solid #1e293b; padding-bottom:10px;">
                                        <div style="color:#38bdf8; font-weight:bold; font-size:14px; margin-bottom:6px;">🏢 ${dName}:</div>
                                        ${items.map(function(it) {
                                            return `
                                                <div style="font-size:13px; color:#cbd5e1; margin-bottom:4px; padding-right:12px; display:flex; justify-content:space-between; gap:10px;">
                                                    <span>• [${it.userName}] ${it.text}</span>
                                                    ${it.metric ? '<span style="color:#34d399; font-weight:bold;">(' + it.metric + ')</span>' : ''}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div style="margin-bottom:18px;">
                            <label style="font-size:13px; font-weight:800; color:#fbbf24; display:block; margin-bottom:6px;">📝 الخلاصة التنفيذية للتقرير التجميعي (Executive Summary) *</label>
                            <textarea id="execSummaryText" rows="3" required placeholder="اكتب ملخص الإنجازات الرئيسية والأداء العام للشركة خلال هذا الشهر..." style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-size:13px; font-weight:600; outline:none;"></textarea>
                        </div>

                        <div style="margin-bottom:22px;">
                            <label style="font-size:13px; font-weight:800; color:#fbbf24; display:block; margin-bottom:6px;">🎯 التوجيهات والتوصيات الإدارية للشهر القادم (Directives) *</label>
                            <textarea id="execDirectivesText" rows="3" required placeholder="اكتب التوجيهات والأهداف المستهدفة للأقسام والموظفين للشهر القادم..." style="width:100%; padding:12px; border-radius:10px; border:1.5px solid #334155; background:#0f172a; color:#ffffff; font-size:13px; font-weight:600; outline:none;"></textarea>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:12px;">
                            <button type="button" onclick="document.getElementById('execMrModalOverlay').remove()" style="background:#334155; color:#cbd5e1; border:1px solid #475569; padding:11px 24px; border-radius:10px; font-weight:800; cursor:pointer;">إلغاء</button>
                            <button type="submit" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#ffffff; border:none; padding:11px 28px; border-radius:10px; font-weight:900; cursor:pointer; box-shadow:0 4px 15px rgba(245,158,11,0.4);">🚀 إعتماد وتصدير التقرير التنفيذي الشامل</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        var existing = document.getElementById('execMrModalOverlay');
        if (existing) existing.remove();

        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
    };

    // If _allMonthlyReports already populated, use it immediately
    if (window._allMonthlyReports && window._allMonthlyReports.length > 0) {
        processAndShowModal(window._allMonthlyReports);
    } else {
        // Live fetch from Firestore
        if (typeof tgShowToast === 'function') tgShowToast('⏳ جاري جلب تقارير الموظفين وإنشاء التقرير التجميعي...');
        targetDb.collection('monthly_reports').get().then(function(snap) {
            var reports = [];
            snap.forEach(function(doc) {
                var data = doc.data();
                data.id = doc.id;
                reports.push(data);
            });
            processAndShowModal(reports);
        }).catch(function(err) {
            alert("حدث خطأ أثناء تحميل التقارير: " + err.message);
        });
    }
};

window.tgSaveMasterExecutiveReport = function(e, monthVal) {
    e.preventDefault();
    if (!window.db) return;

    var u = window.TG_USER || {};
    var execSummary = document.getElementById('execSummaryText').value;
    var execDirectives = document.getElementById('execDirectivesText').value;

    var reports = (window._allMonthlyReports || []).filter(function(r) {
        return r.monthYear === monthVal && r.type !== 'executive_master';
    });

    var deptMap = {};
    reports.forEach(function(r) {
        var deptName = r.userRole || r.department || 'قسم عام';
        if (!deptMap[deptName]) deptMap[deptName] = [];
        var customSections = r.customSections || [];
        if (customSections.length > 0) {
            customSections.forEach(function(sec) {
                (sec.items || []).forEach(function(it) {
                    deptMap[deptName].push({
                        userName: r.userName,
                        secTitle: sec.title,
                        text: it.text,
                        metric: it.metric
                    });
                });
            });
        }
    });

    var masterReportData = {
        type: 'executive_master',
        monthYear: monthVal,
        userName: u.name || u.displayName || 'المدير التنفيذي',
        userRole: 'الإدارة العامة والتنفيذية',
        department: 'الإدارة العليا',
        execSummary: execSummary,
        execDirectives: execDirectives,
        deptBreakdown: deptMap,
        status: 'approved',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('monthly_reports').add(masterReportData).then(function() {
        if (document.getElementById('execMrModalOverlay')) document.getElementById('execMrModalOverlay').remove();
        if (typeof tgShowToast === 'function') tgShowToast('✨ تم اعتماد التقرير الشهري التجميعي للإدارة بنجاح!');
        else alert('✨ تم اعتماد التقرير الشهري التجميعي للإدارة بنجاح!');

        if (typeof tgRenderMonthlyReportsAdmin === 'function') tgRenderMonthlyReportsAdmin();
    });
};



// ─── COMPANY MAIN MEETING ROOM HANDLERS ──────────────────────────────────────

window.tgJoinCompanyMeeting = function(notifyAll) {
    var u = window.TG_USER || {};
    var userName = u.name || u.displayName || u.email || 'عضو في الشركة';
    var roomName = 'techgo-company-main-room-2026';
    var subject = 'غرفة الاجتماعات الرئيسية للشركة';

    if (notifyAll) {
        if (typeof tgBroadcastPush === 'function') {
            tgBroadcastPush('📞 مكالمة واجتماع حي', 'يدعوك ' + userName + ' للانضمام لغرفة الاجتماعات الرئيسية الآن! 🚀', 'livemeeting', { roomName: roomName, topic: subject });
        }
        if (typeof tgShowToast === 'function') tgShowToast('🚀 تم إرسال تنبيه الانضمام المباشر لجميع الموظفين!');
        else alert('🚀 تم إرسال تنبيه الانضمام المباشر لجميع الموظفين!');
    }

    if (typeof startJitsiMeeting === 'function') {
        startJitsiMeeting(roomName, subject, true);
    } else {
        var roomUrl = 'https://meet.ffmuc.net/' + roomName + '#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false';
        window.open(roomUrl, '_blank');
    }
};




// ─── GUARANTEED CALL BROADCAST TO ALL OTHER EMPLOYEES ───────────────────────







// ─── STUBBORN CALL & SOFT CHIME RINGTONE ENGINE ─────────────────────────────

window._persistentCallAudioCtx = null;
window._persistentCallInterval = null;
window._nativeNotifRepeatInterval = null;
window._dismissedCallsSet = new Set();

// Unlock AudioContext on user interaction
window.addEventListener('click', function() {
    if (window._persistentCallAudioCtx && window._persistentCallAudioCtx.state === 'suspended') {
        window._persistentCallAudioCtx.resume().catch(function(){});
    }
}, { once: false });

window.tgStartPersistentTelephoneAudio = function() {
    window.tgStopPersistentTelephoneAudio();
    try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        window._persistentCallAudioCtx = new AudioCtx();
        var ctx = window._persistentCallAudioCtx;

        if (ctx.state === 'suspended') {
            ctx.resume().catch(function(){});
        }

        function playSoftChime() {
            if (!window._persistentCallAudioCtx) return;
            var now = ctx.currentTime;

            // Warm pleasant dual musical notes (C5 = 523.25 Hz, E5 = 659.25 Hz)
            var osc1 = ctx.createOscillator();
            var osc2 = ctx.createOscillator();
            var gain = ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, now);
            osc2.frequency.setValueAtTime(659.25, now);

            // Gentle volume envelope
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 1.35);
            osc2.stop(now + 1.35);
        }

        playSoftChime();
        window._persistentCallInterval = setInterval(playSoftChime, 2200);
    } catch(e){}
};

window.tgStopPersistentTelephoneAudio = function() {
    try {
        if (window._persistentCallInterval) {
            clearInterval(window._persistentCallInterval);
            window._persistentCallInterval = null;
        }
        if (window._nativeNotifRepeatInterval) {
            clearInterval(window._nativeNotifRepeatInterval);
            window._nativeNotifRepeatInterval = null;
        }
        if (window._persistentCallAudioCtx) {
            window._persistentCallAudioCtx.close();
            window._persistentCallAudioCtx = null;
        }
    } catch(e){}
};

// Show Stubborn Full-Screen Ringing Modal (STAYS UNTIL USER CLICKS ACCEPT OR CLOSE)
window.tgShowPersistentCallRingtoneModal = function(callerName, roomUrl, callId) {
    var modal = document.getElementById('tgPersistentCallRingModal');
    if (modal) modal.remove();

    var displayCaller = callerName || (window.TG_USER ? (TG_USER.name || TG_USER.displayName || TG_USER.userName) : '') || localStorage.getItem('tg_user_name') || 'عضو بالفريق / الإدارة';

    var html = `
        <div id="tgPersistentCallRingModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:radial-gradient(circle at center, rgba(16,185,129,0.3) 0%, rgba(15,23,42,0.98) 100%); z-index:99999999; display:flex; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(20px); font-family:sans-serif; color:#ffffff;">
            <div style="text-align:center; max-width:550px; width:90%; margin:0 auto; position:relative; background:#0f172a; padding:35px 25px; border-radius:24px; border:2px solid #10b981; box-shadow:0 20px 50px rgba(0,0,0,0.6);">
                <button type="button" onclick="tgClosePersistentCallModal('${callId}')" style="position:absolute; top:15px; left:15px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#ffffff; font-size:20px; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:900;">✕</button>

                <div style="width:100px; height:100px; background:linear-gradient(135deg, #10b981, #059669); border-radius:50%; display:flex; justify-content:center; align-items:center; margin:0 auto 20px; box-shadow:0 0 35px rgba(16,185,129,0.8);">
                    <span style="font-size:50px;">📞</span>
                </div>

                <span style="background:rgba(16,185,129,0.2); color:#34d399; border:1.5px solid #10b981; padding:6px 20px; border-radius:30px; font-size:13px; font-weight:800; display:inline-block; margin-bottom:15px;">📞 دعوة اجتماع ورنين مباشر متواصل</span>
                <h2 style="color:#ffffff; margin-bottom:6px; font-size:24px; font-weight:900;">دعوة انضمام عاجلة من:</h2>
                <p style="color:#fbbf24; font-size:28px; font-weight:900; margin-bottom:20px; text-shadow:0 2px 10px rgba(245,158,11,0.4);">${displayCaller}</p>

                <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
                    <a href="${roomUrl || 'https://meet.ffmuc.net/techgo-company-main-room-2026'}" target="_blank" onclick="tgClosePersistentCallModal('${callId}')" style="background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; text-decoration:none; padding:16px 36px; border-radius:50px; font-size:17px; font-weight:900; display:inline-flex; align-items:center; gap:8px; box-shadow:0 8px 25px rgba(16,185,129,0.5);">
                        📞 قبول وانضمام للاجتماع
                    </a>
                    <button type="button" onclick="tgClosePersistentCallModal('${callId}')" style="background:#ef4444; color:#ffffff; border:none; padding:16px 28px; border-radius:50px; font-size:16px; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                        ✕ إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    tgStartPersistentTelephoneAudio();
};

window.tgClosePersistentCallModal = function(callId) {
    tgStopPersistentTelephoneAudio();
    var modal = document.getElementById('tgPersistentCallRingModal');
    if (modal) modal.remove();
    if (callId) window._dismissedCallsSet.add(callId);
};

// Trigger Native Device Notification with Repeater Timer to keep it stubborn
window.tgTriggerNativeDeviceCallNotification = function(callerName, roomUrl, callId) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    function sendNotif() {
        if (window._dismissedCallsSet && window._dismissedCallsSet.has(callId)) return;
        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(function(reg) {
                    reg.showNotification('📞 دعوة اجتماع ورنين مباشر متواصل', {
                        body: 'تدعوك الإدارة (' + (callerName || 'الإدارة') + ') للانضمام فوراً لغرفة الاجتماعات المباشرة! 🚀',
                        icon: './icon-192.png',
                        badge: './icon-192.png',
                        dir: 'rtl',
                        lang: 'ar',
                        vibrate: [400, 150, 400, 150, 400, 150, 400],
                        tag: 'persistent-call-' + (callId || 'active'),
                        requireInteraction: true,
                        renotify: true,
                        data: { roomUrl: roomUrl || 'https://meet.ffmuc.net/techgo-company-main-room-2026', callId: callId }
                    });
                });
            }
        } catch(e){}
    }

    sendNotif();

    if (window._nativeNotifRepeatInterval) clearInterval(window._nativeNotifRepeatInterval);
    window._nativeNotifRepeatInterval = setInterval(function() {
        if (window._dismissedCallsSet && window._dismissedCallsSet.has(callId)) {
            clearInterval(window._nativeNotifRepeatInterval);
            return;
        }
        sendNotif();
    }, 6000);
};




// ─── UNBEATABLE GUARANTEED CALL ENGINE (TESTABLE ON ALL TABS & DEVICES) ─────

window._persistentCallAudioCtx = null;
window._persistentCallInterval = null;
window._nativeNotifRepeatInterval = null;
window._titleFlashInterval = null;
window._originalDocumentTitle = document.title;
window._dismissedCallsSet = new Set();
window._myTabSessionId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

// Request notification permission automatically on any user click
document.addEventListener('click', function() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(function(){});
    }
    if (window._persistentCallAudioCtx && window._persistentCallAudioCtx.state === 'suspended') {
        window._persistentCallAudioCtx.resume().catch(function(){});
    }
});

// Powerful Loud Continuous Telephone & Bell Sound Engine
window.tgStartPersistentTelephoneAudio = function() {
    window.tgStopPersistentTelephoneAudio();
    try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        window._persistentCallAudioCtx = new AudioCtx();
        var ctx = window._persistentCallAudioCtx;

        if (ctx.state === 'suspended') {
            ctx.resume().catch(function(){});
        }

        // Title Flash for High Visibility
        window._originalDocumentTitle = document.title;
        var flashStep = 0;
        if (window._titleFlashInterval) clearInterval(window._titleFlashInterval);
        window._titleFlashInterval = setInterval(function() {
            flashStep++;
            document.title = (flashStep % 2 === 1) ? '🔔 (1) تنبيه ورنين مباشر يناديك! 🚀' : '📞 دعوة عاجلة للاجتماع المباشر!';
        }, 1000);

        function playLoudPhoneRingPattern() {
            if (!window._persistentCallAudioCtx) return;
            try {
                if (ctx.state === 'suspended') ctx.resume().catch(function(){});
                var now = ctx.currentTime;

                // Vibration feedback if supported
                if (navigator.vibrate) {
                    try { navigator.vibrate([800, 300, 800, 300, 1000]); } catch(ve){}
                }

                // Dual Tone Telephone Frequency (440 Hz & 480 Hz for authentic ringing)
                var createPulse = function(startTime, duration) {
                    var osc1 = ctx.createOscillator();
                    var osc2 = ctx.createOscillator();
                    var gain = ctx.createGain();

                    osc1.type = 'sine';
                    osc2.type = 'sine';
                    osc1.frequency.setValueAtTime(440, startTime);
                    osc2.frequency.setValueAtTime(480, startTime);

                    // High Gain volume envelope (Loud & Clear)
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.7, startTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(ctx.destination);

                    osc1.start(startTime);
                    osc2.start(startTime);
                    osc1.stop(startTime + duration + 0.05);
                    osc2.stop(startTime + duration + 0.05);
                };

                // Burst 1: Ring for 1.1s
                createPulse(now, 1.1);
                // Burst 2: Ring for 1.1s after 1.4s interval
                createPulse(now + 1.4, 1.1);

            } catch(e){ console.warn("Audio play error:", e); }
        }

        playLoudPhoneRingPattern();
        window._persistentCallInterval = setInterval(playLoudPhoneRingPattern, 3500);
    } catch(e){}
};

window.tgStopPersistentTelephoneAudio = function() {
    try {
        if (window._persistentCallInterval) {
            clearInterval(window._persistentCallInterval);
            window._persistentCallInterval = null;
        }
        if (window._nativeNotifRepeatInterval) {
            clearInterval(window._nativeNotifRepeatInterval);
            window._nativeNotifRepeatInterval = null;
        }
        if (window._titleFlashInterval) {
            clearInterval(window._titleFlashInterval);
            window._titleFlashInterval = null;
            document.title = window._originalDocumentTitle || 'شركة تيك جو';
        }
        if (window._persistentCallAudioCtx) {
            window._persistentCallAudioCtx.close().catch(function(){});
            window._persistentCallAudioCtx = null;
        }
    } catch(e){}
};

// Continuous Full Screen Ringing Modal with Animations
window.tgShowPersistentCallRingtoneModal = function(callerName, roomUrl, callId, targetEmpNames) {
    var modal = document.getElementById('tgPersistentCallRingModal');
    if (modal) modal.remove();

    var displayCaller = callerName || (window.TG_USER ? (TG_USER.name || TG_USER.displayName || TG_USER.userName) : '') || localStorage.getItem('tg_user_name') || 'الإدارة العامة';
    var targetText = (targetEmpNames && targetEmpNames.length > 0 && !targetEmpNames.includes('جميع الموظفين')) 
        ? 'تنبيه ورنين خاص موجه لك 🎯' 
        : 'دعوة انضمام ورنين مباشر لجميع الموظفين 📢';

    var html = `
        <div id="tgPersistentCallRingModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:radial-gradient(circle at center, rgba(16,185,129,0.4) 0%, rgba(15,23,42,0.98) 100%); z-index:99999999; display:flex; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(20px); font-family:sans-serif; color:#ffffff;">
            <style>
                @keyframes tgBellRingAnim {
                    0% { transform: rotate(0deg) scale(1); }
                    10% { transform: rotate(15deg) scale(1.1); }
                    20% { transform: rotate(-15deg) scale(1.1); }
                    30% { transform: rotate(10deg) scale(1.1); }
                    40% { transform: rotate(-10deg) scale(1.1); }
                    50% { transform: rotate(0deg) scale(1); }
                    100% { transform: rotate(0deg) scale(1); }
                }
                @keyframes tgGlowPulse {
                    0% { box-shadow: 0 0 20px rgba(16,185,129,0.5); }
                    50% { box-shadow: 0 0 50px rgba(16,185,129,0.9); }
                    100% { box-shadow: 0 0 20px rgba(16,185,129,0.5); }
                }
            </style>
            <div style="text-align:center; max-width:550px; width:90%; margin:0 auto; position:relative; background:#0f172a; padding:35px 25px; border-radius:28px; border:2.5px solid #10b981; animation:tgGlowPulse 2s infinite;">
                <button type="button" onclick="tgClosePersistentCallModal('${callId}')" style="position:absolute; top:15px; left:15px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#ffffff; font-size:20px; width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:900; transition:all 0.2s;">✕</button>

                <div style="width:105px; height:105px; background:linear-gradient(135deg, #10b981, #059669); border-radius:50%; display:flex; justify-content:center; align-items:center; margin:0 auto 20px; box-shadow:0 0 35px rgba(16,185,129,0.9); animation:tgBellRingAnim 1.5s infinite;">
                    <span style="font-size:52px;">🔔</span>
                </div>

                <span style="background:rgba(16,185,129,0.25); color:#34d399; border:1.5px solid #10b981; padding:7px 22px; border-radius:30px; font-size:13px; font-weight:800; display:inline-block; margin-bottom:16px;">${targetText}</span>
                <h2 style="color:#ffffff; margin-bottom:6px; font-size:24px; font-weight:900;">طلب رنين وانضمام عاجل من:</h2>
                <p style="color:#fbbf24; font-size:28px; font-weight:900; margin-bottom:24px; text-shadow:0 2px 10px rgba(245,158,11,0.4);">${displayCaller}</p>

                <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
                    <a href="${roomUrl || 'https://meet.ffmuc.net/techgo-company-main-room-2026'}" target="_blank" onclick="tgClosePersistentCallModal('${callId}')" style="background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; text-decoration:none; padding:16px 36px; border-radius:50px; font-size:17px; font-weight:900; display:inline-flex; align-items:center; gap:8px; box-shadow:0 8px 25px rgba(16,185,129,0.5); transition:transform 0.2s;">
                        📞 قبول وانضمام للاجتماع
                    </a>
                    <button type="button" onclick="tgClosePersistentCallModal('${callId}')" style="background:#ef4444; color:#ffffff; border:none; padding:16px 28px; border-radius:50px; font-size:16px; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                        ✕ كتم / إغلاق
                    </button>
                </div>
            </div>
        </div>
    `;

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);

    tgStartPersistentTelephoneAudio();
    if (typeof tgTriggerNativeDeviceCallNotification === 'function') {
        tgTriggerNativeDeviceCallNotification(displayCaller, roomUrl, callId);
    }
};

window.tgClosePersistentCallModal = function(callId) {
    tgStopPersistentTelephoneAudio();
    var modal = document.getElementById('tgPersistentCallRingModal');
    if (modal) modal.remove();
    if (callId) window._dismissedCallsSet.add(callId);
};

window.tgTriggerNativeDeviceCallNotification = function(callerName, roomUrl, callId) {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") {
        Notification.requestPermission().then(function(perm) {
            if (perm === "granted") window.tgTriggerNativeDeviceCallNotification(callerName, roomUrl, callId);
        }).catch(function(){});
        return;
    }

    function sendNotif() {
        if (window._dismissedCallsSet && window._dismissedCallsSet.has(callId)) return;
        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(function(reg) {
                    reg.showNotification('📞 دعوة اجتماع ورنين مباشر متواصل 🔔', {
                        body: 'تدعوك الإدارة (' + (callerName || 'الإدارة') + ') للانضمام فوراً لغرفة الاجتماعات المباشرة! 🚀',
                        icon: './icon-192.png',
                        badge: './icon-192.png',
                        dir: 'rtl',
                        lang: 'ar',
                        vibrate: [500, 200, 500, 200, 500],
                        tag: 'persistent-call-' + (callId || 'active'),
                        requireInteraction: true,
                        renotify: true,
                        data: { roomUrl: roomUrl || 'https://meet.ffmuc.net/techgo-company-main-room-2026', callId: callId }
                    });
                });
            } else {
                new Notification('📞 دعوة اجتماع ورنين مباشر متواصل 🔔', {
                    body: 'تدعوك الإدارة (' + (callerName || 'الإدارة') + ') للانضمام فوراً لغرفة الاجتماعات المباشرة! 🚀',
                    icon: './icon-192.png',
                    requireInteraction: true
                });
            }
        } catch(e){}
    }

    sendNotif();

    if (window._nativeNotifRepeatInterval) clearInterval(window._nativeNotifRepeatInterval);
    window._nativeNotifRepeatInterval = setInterval(function() {
        if (window._dismissedCallsSet && window._dismissedCallsSet.has(callId)) {
            clearInterval(window._nativeNotifRepeatInterval);
            return;
        }
        sendNotif();
    }, 4500);
};

// ─── TARGETED & BROADCAST NOTIFICATION MODAL ENGINE ─────────────────────────

if (!window._myTabSessionId) {
    window._myTabSessionId = 'tab_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
}

// Global entry point called by the button in index.html & employee.html
window.tgBroadcastCallNotification = function() {
    window.tgOpenCallTargetModal();
};

// Open modal to choose between alerting ALL employees or SPECIFIC employees
window.tgOpenCallTargetModal = function() {
    var modal = document.getElementById('tgCallTargetSelectionModal');
    if (!modal) {
        window.tgCreateCallTargetSelectionModalHTML();
        modal = document.getElementById('tgCallTargetSelectionModal');
    }
    
    // Reset mode to 'all'
    window.tgSwitchCallTargetTab('all');
    
    // Fetch users for target picker list
    window.tgFetchUsersForCallTargets();

    // Populate user list
    window.tgRenderCallTargetUserList();
    if (modal) modal.style.display = 'flex';
};

window.tgCloseCallTargetModal = function() {
    var modal = document.getElementById('tgCallTargetSelectionModal');
    if (modal) modal.style.display = 'none';
};

window.tgCreateCallTargetSelectionModalHTML = function() {
    var existing = document.getElementById('tgCallTargetSelectionModal');
    if (existing) existing.remove();

    var html = `
    <div id="tgCallTargetSelectionModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.85); z-index:999999; flex-direction:column; justify-content:center; align-items:center; backdrop-filter:blur(12px); font-family:sans-serif; color:#ffffff;">
        <div style="background:#0f172a; border:2px solid rgba(16,185,129,0.4); border-radius:24px; width:92%; max-width:620px; padding:28px; box-shadow:0 25px 60px rgba(0,0,0,0.8); max-height:90vh; display:flex; flex-direction:column;">
            
            <!-- Modal Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; border-bottom:1px solid #334155; padding-bottom:16px;">
                <div>
                    <h3 style="margin:0; font-size:20px; font-weight:900; color:#ffffff; display:flex; align-items:center; gap:10px;">
                        <span style="display:inline-flex; justify-content:center; align-items:center; width:36px; height:36px; border-radius:10px; background:rgba(16,185,129,0.2); color:#10b981; font-size:20px;">🔔</span>
                        إرسال تنبيه ورنين للموظفين
                    </h3>
                    <p style="margin:6px 0 0; font-size:13px; color:#94a3b8;">اختر هل تريد رنين هواتف جميع الموظفين بالشركة أو تحديد موظفين محددين</p>
                </div>
                <button type="button" onclick="tgCloseCallTargetModal()" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#ffffff; width:36px; height:36px; border-radius:50%; display:flex; justify-content:center; align-items:center; cursor:pointer; font-size:18px; font-weight:bold;">✕</button>
            </div>

            <!-- Mode Selector Tabs -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px; background:#1e293b; padding:6px; border-radius:14px; border:1px solid #334155;">
                <button type="button" id="tgTargetTabAll" onclick="tgSwitchCallTargetTab('all')" style="background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; border:none; padding:12px; border-radius:10px; font-weight:800; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                    <span>📢</span> جميع الموظفين
                </button>
                <button type="button" id="tgTargetTabSpecific" onclick="tgSwitchCallTargetTab('specific')" style="background:transparent; color:#cbd5e1; border:none; padding:12px; border-radius:10px; font-weight:800; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span>🎯</span> تحديد موظف بعينه / محددين
                </button>
            </div>

            <!-- Tab Content: ALL Employees -->
            <div id="tgCallTargetAllContent" style="display:block; text-align:center; padding:20px 10px; background:rgba(30,41,59,0.5); border-radius:16px; border:1px solid rgba(255,255,255,0.08); margin-bottom:20px;">
                <div style="font-size:45px; margin-bottom:10px;">📡</div>
                <h4 style="color:#ffffff; margin:0 0 8px; font-size:17px; font-weight:900;">سيتم تشغيل الرنين الفوري على أجهزة جميع الموظفين</h4>
                <p style="color:#94a3b8; font-size:13px; margin:0; line-height:1.6;">سيتلقى كافة أعضاء الفريق والموظفين بالشركة تنبيهاً ورنيناً متواصلاً للانضمام فوراً للاجتماع.</p>
            </div>

            <!-- Tab Content: Specific Employees Picker -->
            <div id="tgCallTargetSpecificContent" style="display:none; flex-direction:column; flex:1; overflow:hidden;">
                <!-- Search & Actions -->
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
                    <input type="text" id="tgCallTargetSearch" oninput="tgFilterCallTargetUsers()" placeholder="🔍 ابحث عن اسم الموظف..." style="flex:1; background:#1e293b; border:1px solid #334155; color:#ffffff; padding:10px 14px; border-radius:10px; font-size:13px; outline:none;">
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="tgSelectAllCallTargets(true)" style="background:rgba(16,185,129,0.2); border:1px solid #10b981; color:#34d399; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">✓ الكل</button>
                        <button type="button" onclick="tgSelectAllCallTargets(false)" style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#f87171; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;">✕ إغلاق الكل</button>
                    </div>
                </div>

                <!-- User Checkbox List -->
                <div id="tgCallTargetUserList" style="flex:1; overflow-y:auto; max-height:260px; padding-right:4px; display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
                    <!-- Rendered dynamically -->
                </div>
            </div>

            <!-- Modal Action Footer -->
            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #334155; padding-top:18px;">
                <button type="button" onclick="tgCloseCallTargetModal()" style="background:#1e293b; border:1px solid #334155; color:#cbd5e1; padding:12px 24px; border-radius:50px; cursor:pointer; font-size:14px; font-weight:bold;">إلغاء</button>
                <button type="button" id="tgSubmitCallTargetBtn" onclick="tgSubmitCallTargetNotification()" style="background:linear-gradient(135deg, #10b981, #059669); color:#ffffff; border:none; padding:12px 32px; border-radius:50px; cursor:pointer; font-weight:900; font-size:15px; box-shadow:0 6px 20px rgba(16,185,129,0.4); display:inline-flex; align-items:center; gap:8px;">
                    <span>🔔</span> إرسال الرنين والتنبيه للجميع
                </button>
            </div>

        </div>
    </div>
    `;

    var div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
};

window._tgCallTargetMode = 'all';

window.tgSwitchCallTargetTab = function(mode) {
    window._tgCallTargetMode = mode;
    var tabAll = document.getElementById('tgTargetTabAll');
    var tabSpec = document.getElementById('tgTargetTabSpecific');
    var contentAll = document.getElementById('tgCallTargetAllContent');
    var contentSpec = document.getElementById('tgCallTargetSpecificContent');
    var btn = document.getElementById('tgSubmitCallTargetBtn');

    if (mode === 'all') {
        if (tabAll) { tabAll.style.background = 'linear-gradient(135deg, #10b981, #059669)'; tabAll.style.color = '#ffffff'; tabAll.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)'; }
        if (tabSpec) { tabSpec.style.background = 'transparent'; tabSpec.style.color = '#cbd5e1'; tabSpec.style.boxShadow = 'none'; }
        if (contentAll) contentAll.style.display = 'block';
        if (contentSpec) contentSpec.style.display = 'none';
        if (btn) btn.innerHTML = '<span>🔔</span> إرسال الرنين والتنبيه للجميع';
    } else {
        if (tabSpec) { tabSpec.style.background = 'linear-gradient(135deg, #10b981, #059669)'; tabSpec.style.color = '#ffffff'; tabSpec.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)'; }
        if (tabAll) { tabAll.style.background = 'transparent'; tabAll.style.color = '#cbd5e1'; tabAll.style.boxShadow = 'none'; }
        if (contentAll) contentAll.style.display = 'none';
        if (contentSpec) contentSpec.style.display = 'flex';
        if (btn) btn.innerHTML = '<span>🎯</span> إرسال الرنين للموظفين المختارين';
    }
};

window.tgFetchUsersForCallTargets = async function() {
    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) return [];

    try {
        var snap = await targetDb.collection('users').get();
        window._lastUsersSnap = snap;
        if (typeof tgRenderCallTargetUserList === 'function') {
            tgRenderCallTargetUserList();
        }
        return snap;
    } catch(err) {
        console.error("Fetch Users Error:", err);
        return [];
    }
};

window.tgRenderCallTargetUserList = function() {
    var listContainer = document.getElementById('tgCallTargetUserList');
    if (!listContainer) return;

    var rawUsers = [];
    if (window._lastUsersSnap && !window._lastUsersSnap.empty) {
        window._lastUsersSnap.forEach(function(doc) {
            var d = doc.data() || {};
            var uid = doc.id;
            var name = d.name || d.displayName || d.userName || d.email || uid;
            var role = d.role || d.jobTitle || 'موظف';
            rawUsers.push({ uid: uid, name: name, role: role });
        });
    } else if (Array.isArray(window.allUsers) && window.allUsers.length > 0) {
        rawUsers = window.allUsers.map(function(u) {
            return { uid: u.uid || u.id, name: u.name || u.displayName || u.userName || u.email, role: u.role || 'موظف' };
        });
    }

    if (rawUsers.length === 0) {
        listContainer.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:20px; font-size:13px; font-weight:bold;">⏳ جاري جلب قائمة الموظفين...</div>';
        return;
    }

    // Deduplicate by UID and Clean Name
    var seenUids = new Set();
    var seenNames = new Set();
    var users = [];

    rawUsers.forEach(function(u) {
        var uid = (u.uid || '').trim();
        var cleanName = (u.name || '').trim().toLowerCase();

        if (uid && seenUids.has(uid)) return;
        if (cleanName && seenNames.has(cleanName)) return;

        if (uid) seenUids.add(uid);
        if (cleanName) seenNames.add(cleanName);

        users.push(u);
    });

    users.sort(function(a,b){ return (a.name || '').localeCompare(b.name || '', 'ar'); });

    var html = '';
    users.forEach(function(u) {
        html += `
        <label class="tg-call-user-item" data-search="${(u.name + ' ' + u.role).toLowerCase()}" style="display:flex; align-items:center; justify-content:space-between; background:#1e293b; border:1px solid #334155; padding:10px 14px; border-radius:10px; cursor:pointer; transition:all 0.2s;">
            <div style="display:flex; align-items:center; gap:10px;">
                <input type="checkbox" class="tg-call-target-chk" value="${u.uid}" data-name="${u.name}" style="width:18px; height:18px; accent-color:#10b981; cursor:pointer;">
                <div>
                    <div style="font-size:14px; font-weight:bold; color:#ffffff;">${u.name}</div>
                    <div style="font-size:11px; color:#94a3b8;">${u.role}</div>
                </div>
            </div>
            <span style="font-size:11px; background:rgba(16,185,129,0.15); color:#34d399; padding:3px 8px; border-radius:6px; font-weight:bold;">👤 موظف</span>
        </label>
        `;
    });
    listContainer.innerHTML = html;
};

window.tgFilterCallTargetUsers = function() {
    var input = document.getElementById('tgCallTargetSearch');
    var query = input ? input.value.trim().toLowerCase() : '';
    var items = document.querySelectorAll('#tgCallTargetUserList .tg-call-user-item');
    items.forEach(function(item) {
        var searchData = item.getAttribute('data-search') || '';
        if (!query || searchData.indexOf(query) !== -1) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
};

window.tgSelectAllCallTargets = function(selectAll) {
    var chks = document.querySelectorAll('#tgCallTargetUserList .tg-call-target-chk');
    chks.forEach(function(chk) {
        chk.checked = !!selectAll;
    });
};

window.tgSubmitCallTargetNotification = async function() {
    var mode = window._tgCallTargetMode || 'all';
    var targetUids = [];
    var targetNames = [];

    if (mode === 'specific') {
        var chks = document.querySelectorAll('#tgCallTargetUserList .tg-call-target-chk:checked');
        if (chks.length === 0) {
            alert('⚠️ يرجى تحديد موظف واحد على الأقل لإرسال الرنين له.');
            return;
        }
        chks.forEach(function(chk) {
            targetUids.push(chk.value);
            targetNames.push(chk.getAttribute('data-name') || 'موظف');
        });
    } else {
        targetUids = ['all'];
        targetNames = ['جميع الموظفين'];
    }

    var submitBtn = document.getElementById('tgSubmitCallTargetBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '⏳ جاري إرسال الرنين...';
    }

    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) {
        alert('❌ تعذر الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = (mode === 'all') ? '<span>🔔</span> إرسال الرنين والتنبيه للجميع' : '<span>🎯</span> إرسال الرنين للموظفين المختارين';
        }
        return;
    }

    if (!window._myTabSessionId) {
        window._myTabSessionId = 'tab_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    }

    var u = window.TG_USER || {};
    var callerName = u.name || u.displayName || u.userName || localStorage.getItem('tg_user_name') || 'الإدارة العامة';
    var callerUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : '');

    try {
        await targetDb.collection('company_meeting_calls').add({
            callerName: callerName,
            callerUid: callerUid,
            senderTabId: window._myTabSessionId,
            roomUrl: 'https://meet.ffmuc.net/techgo-company-main-room-2026',
            targetEmpUids: targetUids,
            targetEmpNames: targetNames,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            clientTimestamp: Date.now()
        });

        // Send Push Notifications to targeted users so background listeners receive it
        if (mode === 'all') {
            if (typeof tgBroadcastPush === 'function') {
                tgBroadcastPush('📞 دعوة اجتماع ورنين مباشر 🔔', 'تدعوك الإدارة (' + callerName + ') للانضمام فوراً لغرفة الاجتماعات المباشرة! 🚀', 'techgo-call', callerUid, { isCall: true, roomUrl: 'https://meet.ffmuc.net/techgo-company-main-room-2026' });
            }
        } else {
            if (typeof tgSendPushToUser === 'function') {
                targetUids.forEach(function(tUid) {
                    if (tUid !== callerUid && tUid !== 'all') {
                        tgSendPushToUser(tUid, '📞 دعوة اجتماع ورنين مباشر 🔔', 'تدعوك الإدارة (' + callerName + ') للانضمام فوراً لغرفة الاجتماعات المباشرة! 🚀', 'techgo-call', { isCall: true, roomUrl: 'https://meet.ffmuc.net/techgo-company-main-room-2026' });
                    }
                });
            }
        }

        window.tgCloseCallTargetModal();

        if (typeof tgShowToast === 'function') {
            tgShowToast('🔔 تم إرسال الرنين والتنبيه بنجاح!');
        } else {
            alert('🔔 تم إرسال الرنين والتنبيه بنجاح!');
        }

        var outTag = document.getElementById('outgoingCallTag');
        var outTarget = document.getElementById('outgoingTargetNameText');
        if (outTag) outTag.innerText = '📡 جاري الاتصال المباشر (رنين جارٍ 🔔)';
        if (outTarget) {
            outTarget.innerHTML = (mode === 'all') 
                ? '🔔 جاري رنين هاتف جميع الموظفين الآن...' 
                : '🔔 جاري الرنين على الموظفين المحددين...';
        }
    } catch (err) {
        console.error('Error submitting call notification:', err);
        alert('❌ حدث خطأ أثناء إرسال الرنين: ' + (err.message || err));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = (mode === 'all') ? '<span>🔔</span> إرسال الرنين والتنبيه للجميع' : '<span>🎯</span> إرسال الرنين للموظفين المختارين';
        }
    }
};

window.tgInitPersistentMeetingCallListener = function() {
    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) {
        setTimeout(tgInitPersistentMeetingCallListener, 500);
        return;
    }

    try {
        targetDb.collection('company_meeting_calls').limit(15).onSnapshot(function(snap) {
            var calls = [];
            snap.forEach(function(doc) {
                calls.push({ id: doc.id, data: doc.data() });
            });

            if (calls.length === 0) return;

            // Sort latest first by timestamp
            calls.sort(function(a, b) {
                var tA = a.data.clientTimestamp || (a.data.createdAt && a.data.createdAt.toMillis ? a.data.createdAt.toMillis() : 0);
                var tB = b.data.clientTimestamp || (b.data.createdAt && b.data.createdAt.toMillis ? b.data.createdAt.toMillis() : 0);
                return tB - tA;
            });

            var latest = calls[0];
            var data = latest.data;
            var docId = latest.id;

            if (window._dismissedCallsSet && window._dismissedCallsSet.has(docId)) return;

            // Don't show call modal ONLY on the exact tab that sent the call
            if (data.senderTabId && data.senderTabId === window._myTabSessionId) return;

            var callTime = data.clientTimestamp || (data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : Date.now());
            if (Date.now() - callTime > 300000) return; // Skip calls > 5m

            // Check if notification is targeted to current user
            var u = window.TG_USER || {};
            var myUid = u.uid || (window.firebase && firebase.auth && firebase.auth().currentUser ? firebase.auth().currentUser.uid : null);
            var myEmpId = u.empId || u.id;
            var myName = u.name || u.displayName || u.userName || u.email;

            var targetUids = data.targetEmpUids || [];
            var targetNames = data.targetEmpNames || [];
            var isForMe = false;

            if (!targetUids || !Array.isArray(targetUids) || targetUids.length === 0 || targetUids.includes('all')) {
                isForMe = true;
            } else {
                // Match against UID directly (Primary)
                if (myUid && targetUids.includes(myUid)) isForMe = true;
                if (myEmpId && targetUids.includes(myEmpId)) isForMe = true;

                // Match against Name or Email
                if (myName && (targetUids.includes(myName) || targetNames.includes(myName))) isForMe = true;
                if (u.name && (targetUids.includes(u.name) || targetNames.includes(u.name))) isForMe = true;

                // Clean / Exact Name Match (Prevents accidental ringing due to partial substring matching)
                if (!isForMe) {
                    var cleanKey = function(s) {
                        return s ? String(s).toLowerCase().replace(/^أ\/\s*/g, '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() : '';
                    };
                    var myClean = cleanKey(myName || u.name || u.displayName || u.email);
                    if (myClean) {
                        targetNames.forEach(function(tn) {
                            var tnClean = cleanKey(tn);
                            if (tnClean && myClean === tnClean) isForMe = true;
                        });
                        targetUids.forEach(function(tu) {
                            var tuClean = cleanKey(tu);
                            if (tuClean && myClean === tuClean) isForMe = true;
                        });
                    }
                }
            }

            if (!isForMe) return;

            window.tgShowPersistentCallRingtoneModal(data.callerName, data.roomUrl, docId, data.targetEmpNames);}, function(err) {
            console.error("Company call listener error:", err);
        });
    } catch(e) {
        console.error("Error setting up call listener:", e);
    }
};

setTimeout(function() {
    if (typeof tgInitPersistentMeetingCallListener === 'function') tgInitPersistentMeetingCallListener();
}, 1000);

// Helper to notify all admins when a new employee report or plan is submitted
window.tgNotifyAdminsReportSubmitted = function(typeTitle, empName, detailsText, tag) {
    if (typeof tgNotifyAdmins === 'function') {
        tgNotifyAdmins(typeTitle, 'قام الموظف (' + empName + ') بتقديم ' + detailsText + ' 🚀', tag);
    }
    var targetDb = window.db || (typeof db !== 'undefined' ? db : null);
    if (targetDb) {
        targetDb.collection('admin_notifications').add({
            title: typeTitle,
            body: 'قام الموظف (' + empName + ') بتقديم ' + detailsText + ' 🚀',
            empName: empName,
            type: tag,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function(e){});
    }
};

window.tgInitAdminReportNotificationsListener = function() {
    var targetDb = window.db || (typeof db !== 'undefined' ? db : (window.firebase ? firebase.firestore() : null));
    if (!targetDb) {
        setTimeout(tgInitAdminReportNotificationsListener, 1000);
        return;
    }

    var u = window.TG_USER || {};
    var role = u.role || localStorage.getItem('tg_user_role') || '';
    // Only admins listen to report notifications
    if (role !== 'admin' && role !== 'tech_admin') return;

    try {
        targetDb.collection('admin_notifications').orderBy('createdAt', 'desc').limit(5).onSnapshot(function(snap) {
            snap.docChanges().forEach(function(change) {
                if (change.type === 'added') {
                    var data = change.doc.data();
                    var t = data.createdAt ? (data.createdAt.toMillis ? data.createdAt.toMillis() : Date.now()) : Date.now();
                    if (Date.now() - t < 120000) { // Notify only for recent submissions (<2m)
                        if (typeof tgShowToast === 'function') {
                            tgShowToast('🔔 ' + data.title + ': ' + data.body);
                        }
                    }
                }
            });
        }, function(e){});
    } catch(e){}
};

setTimeout(function(){
    if (typeof tgInitAdminReportNotificationsListener === 'function') tgInitAdminReportNotificationsListener();
}, 2000);
